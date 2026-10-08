import { useCallback, useEffect, useState } from 'react';
import { Row, Segmented, Switch } from '@/components/ui';
import { SpeakButton } from '@/components/SpeakButton';
import { useI18n } from '@/i18n';
import { logEvent } from '@/lib/log';
import { invoke, isTauri } from '@/lib/tauri';
import { accentLabel, cloudVoices, isEnglishVoice, loadVoices, noticeText, resetCloudState, SPEEDS, testCloud, ttsAvailable, voiceLabel, type Accent, type ProviderId } from '@/lib/tts';
import { useSettings } from '@/stores/settings';
import { toast } from '@/stores/toast';

interface CacheInfo {
  bytes: number;
  files: number;
}

const fmtBytes = (b: number): string => (b < 1024 ? `${b} B` : b < 1024 * 1024 ? `${(b / 1024).toFixed(1)} KB` : `${(b / 1024 / 1024).toFixed(1)} MB`);

const REGIONS = ['eastus', 'westus2', 'westeurope', 'uksouth', 'northeurope', 'southeastasia', 'uaenorth'];

/** Settings → English → Pronunciation. The API key goes straight to the OS credential store and is never read back. */
export function Pronunciation() {
  const { l, lang } = useI18n();
  const ar = lang === 'ar';
  const settings = useSettings((s) => s.settings);
  const set = useSettings((s) => s.set);
  const desktop = isTauri();
  const provider: ProviderId = desktop ? settings.ttsProvider : 'system';
  const accent: Accent = settings.enAccent === 'gb' ? 'gb' : 'us';
  const cloud = provider !== 'system';

  const [sysVoices, setSysVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [hasKey, setHasKey] = useState(false);
  const [keyInput, setKeyInput] = useState('');
  const [cache, setCache] = useState<CacheInfo | null>(null);
  const [cachePath, setCachePath] = useState('');
  const [testing, setTesting] = useState(false);
  const [testMsg, setTestMsg] = useState<string | null>(null);

  useEffect(() => {
    if (!ttsAvailable()) return;
    void loadVoices().then((v) => setSysVoices(v.filter(isEnglishVoice)));
  }, []);

  const refreshKey = useCallback(async () => {
    if (!desktop || !cloud) return setHasKey(false);
    try {
      setHasKey(await invoke<boolean>('tts_key_status', { provider }));
    } catch {
      setHasKey(false);
    }
  }, [desktop, cloud, provider]);
  useEffect(() => void refreshKey(), [refreshKey]);

  const refreshCache = useCallback(async () => {
    if (!desktop) return;
    try {
      setCache(await invoke<CacheInfo>('tts_cache_info'));
      setCachePath(await invoke<string>('tts_cache_path'));
    } catch (e) {
      logEvent('warn', `tts cache info: ${String(e)}`);
    }
  }, [desktop]);
  useEffect(() => void refreshCache(), [refreshCache]);

  const saveKey = async () => {
    const key = keyInput.trim();
    if (!key || !cloud) return;
    try {
      await invoke('tts_key_set', { provider, key });
      setKeyInput('');
      resetCloudState();
      setTestMsg(null);
      await refreshKey();
      toast({ kind: 'success', title: l({ en: 'Key saved securely', ar: 'تم حفظ المفتاح بأمان' }) });
    } catch {
      toast({ kind: 'error', title: l({ en: 'Could not save the key on this device', ar: 'تعذر حفظ المفتاح على هذا الجهاز' }) });
    }
  };

  const removeKey = async () => {
    try {
      await invoke('tts_key_clear', { provider });
      resetCloudState();
      setTestMsg(null);
      await refreshKey();
    } catch {
      toast({ kind: 'error', title: l({ en: 'Could not remove the key', ar: 'تعذر حذف المفتاح' }) });
    }
  };

  const clearCache = async () => {
    try {
      await invoke<number>('tts_cache_clear');
      await refreshCache();
      toast({ kind: 'success', title: l({ en: 'Audio cache cleared', ar: 'تم مسح ذاكرة الصوت' }) });
    } catch {
      toast({ kind: 'error', title: l({ en: 'Could not clear the cache', ar: 'تعذر مسح الذاكرة' }) });
    }
  };

  const test = async () => {
    setTesting(true);
    setTestMsg(null);
    const r = await testCloud('Hello, how are you?');
    setTesting(false);
    setTestMsg(r.ok ? l({ en: 'Voice works.', ar: 'الصوت يعمل.' }) : noticeText(r.reason ?? 'provider_error', ar));
    void refreshCache();
  };

  const cloudList = cloud ? cloudVoices(provider, accent) : [];
  const accentSys = sysVoices.filter((v) => (accent === 'gb' ? /^en[-_]GB/i : /^en[-_]US/i).test(v.lang));
  const sysList = accentSys.length ? accentSys : sysVoices;
  const speedLabel = (s: number) => `${s}×`;
  const providerName = provider === 'azure' ? 'Azure Neural Speech' : provider === 'elevenlabs' ? 'ElevenLabs' : l({ en: 'Device voice', ar: 'صوت الجهاز' });

  return (
    <>
      <Row title={l({ en: 'Voice provider', ar: 'مزود الصوت' })} hint={l({ en: 'Natural neural voices need an internet connection and your own key. The device voice always works offline.', ar: 'الأصوات العصبية الطبيعية تحتاج إنترنت ومفتاحك الخاص. صوت الجهاز يعمل دائمًا بدون إنترنت.' })}>
        <select
          className="input w-56"
          dir="ltr"
          value={provider}
          onChange={(e) => {
            resetCloudState();
            setTestMsg(null);
            void set('ttsProvider', e.target.value as ProviderId);
            void set('ttsVoice', '');
          }}
        >
          <option value="system">{l({ en: 'Device voice (offline)', ar: 'صوت الجهاز (بدون إنترنت)' })}</option>
          {desktop && <option value="azure">Azure Neural Speech</option>}
          {desktop && <option value="elevenlabs">ElevenLabs</option>}
        </select>
      </Row>

      {cloud && (
        <>
          <Row
            title={l({ en: 'API key', ar: 'مفتاح الواجهة' })}
            hint={hasKey ? l({ en: 'A key is stored in your system credential manager. It is never shown again.', ar: 'المفتاح محفوظ في مدير بيانات الاعتماد بالنظام ولا يظهر مرة أخرى.' }) : l({ en: 'Paste your key. It is stored only in your system credential manager, not in the app files.', ar: 'الصق مفتاحك. يُحفظ فقط في مدير بيانات الاعتماد بالنظام وليس في ملفات التطبيق.' })}
          >
            <div className="flex flex-wrap items-center gap-2">
              <input
                className="input w-56"
                dir="ltr"
                type="password"
                autoComplete="off"
                spellCheck={false}
                placeholder={hasKey ? '••••••••••••' : l({ en: 'Enter key', ar: 'أدخل المفتاح' })}
                value={keyInput}
                onChange={(e) => setKeyInput(e.target.value)}
              />
              <button className="btn btn-soft btn-sm" disabled={!keyInput.trim()} onClick={() => void saveKey()}>{l({ en: 'Save', ar: 'حفظ' })}</button>
              {hasKey && <button className="btn-ghost btn-sm" onClick={() => void removeKey()}>{l({ en: 'Remove', ar: 'إزالة' })}</button>}
            </div>
          </Row>
          {provider === 'azure' && (
            <Row title={l({ en: 'Azure region', ar: 'منطقة Azure' })} hint={l({ en: 'The region of your Speech resource.', ar: 'منطقة مورد الكلام الخاص بك.' })}>
              <select className="input w-56" dir="ltr" value={settings.ttsRegion} onChange={(e) => { resetCloudState(); void set('ttsRegion', e.target.value); }}>
                {(REGIONS.includes(settings.ttsRegion) ? REGIONS : [settings.ttsRegion, ...REGIONS]).map((r) => <option key={r} value={r}>{r}</option>)}
              </select>
            </Row>
          )}
        </>
      )}

      <Row title={l({ en: 'Accent', ar: 'اللهجة' })}>
        <Segmented<Accent> value={accent} onChange={(v) => { void set('enAccent', v); void set('ttsVoice', ''); }} label="accent" options={[{ value: 'us', label: accentLabel('us') }, { value: 'gb', label: accentLabel('gb') }]} />
      </Row>

      <Row title={l({ en: 'Voice', ar: 'الصوت' })} hint={!cloud && !ttsAvailable() ? l({ en: 'Speech is not available here.', ar: 'النطق غير متاح هنا.' }) : !cloud && !sysVoices.length ? l({ en: 'No English voice found on this system.', ar: 'لا يوجد صوت إنجليزي في النظام.' }) : undefined}>
        <div className="flex items-center gap-2">
          {cloud ? (
            <select className="input w-56" dir="ltr" value={settings.ttsVoice} onChange={(e) => void set('ttsVoice', e.target.value)}>
              <option value="">{l({ en: 'Recommended', ar: 'الموصى به' })}</option>
              {cloudList.map((v) => <option key={v.id} value={v.id}>{voiceLabel(v)}</option>)}
            </select>
          ) : (
            <select className="input w-56" dir="ltr" value={settings.enVoice} onChange={(e) => void set('enVoice', e.target.value)} disabled={!sysVoices.length}>
              <option value="">{l({ en: 'Automatic', ar: 'تلقائي' })}</option>
              {sysList.map((v) => <option key={v.voiceURI} value={v.voiceURI}>{v.name}</option>)}
            </select>
          )}
          <SpeakButton text="Hello, welcome to Namaa." size="sm" />
        </div>
      </Row>

      <Row title={l({ en: 'Default speed', ar: 'السرعة الافتراضية' })} hint={l({ en: 'The turtle button is always slower.', ar: 'زر السلحفاة أبطأ دائمًا.' })}>
        <Segmented<string> value={String(SPEEDS.find((s) => s === settings.enRate) ?? 1)} onChange={(v) => void set('enRate', Number(v))} label="speed" options={SPEEDS.map((s) => ({ value: String(s), label: speedLabel(s) }))} />
      </Row>

      <Row title={l({ en: 'Auto-play pronunciation', ar: 'تشغيل النطق تلقائيًا' })}>
        <Switch checked={settings.enAutoPlay} onChange={(v) => void set('enAutoPlay', v)} label="auto-play" />
      </Row>

      {cloud && (
        <Row title={l({ en: 'Test voice', ar: 'اختبار الصوت' })} hint={testMsg ?? undefined}>
          <button className="btn btn-soft btn-sm" disabled={testing || !hasKey} onClick={() => void test()}>{testing ? l({ en: 'Testing…', ar: 'جارٍ الاختبار…' }) : l({ en: 'Play sample', ar: 'تشغيل عينة' })}</button>
        </Row>
      )}

      {desktop && (
        <Row
          title={l({ en: 'Audio cache', ar: 'ذاكرة الصوت' })}
          hint={
            <>
              <span dir="auto" className="block">{providerName}</span>
              <span dir="ltr" className="block break-all">{`${cache ? `${fmtBytes(cache.bytes)} · ${cache.files} files` : '…'}${cachePath ? ` · ${cachePath}` : ''}`}</span>
            </>
          }
        >
          <button className="btn btn-soft btn-sm" disabled={!cache || cache.files === 0} onClick={() => void clearCache()}>{l({ en: 'Clear cache', ar: 'مسح الذاكرة' })}</button>
        </Row>
      )}
    </>
  );
}
