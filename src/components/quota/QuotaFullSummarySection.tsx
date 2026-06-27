import { useCallback, useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { quotaStatusFullApi } from '@/services/api/quotaStatusFull';
import { TYPE_COLORS } from '@/utils/quota/constants';
import type { AntigravityModelEntry, QuotaFullEntry, QuotaWindow } from '@/types/quotaStatusFull';
import styles from './QuotaFullSummarySection.module.scss';

interface Props {
  disabled?: boolean;
}

type LoadState = 'idle' | 'loading' | 'success' | 'error';

function formatRelativeTime(date: Date, t: (key: string, opts?: Record<string, unknown>) => string): string {
  const seconds = Math.round((Date.now() - date.getTime()) / 1000);
  if (seconds < 5) return t('quota_summary.just_now');
  if (seconds < 60) return t('quota_summary.seconds_ago', { count: seconds });
  const minutes = Math.round(seconds / 60);
  if (minutes < 60) return t('quota_summary.minutes_ago', { count: minutes });
  const hours = Math.round(minutes / 60);
  return t('quota_summary.hours_ago', { count: hours });
}

function formatResetTime(isoString: string, t: (key: string, opts?: Record<string, unknown>) => string): string {
  try {
    const date = new Date(isoString);
    const diffMs = date.getTime() - Date.now();
    if (diffMs <= 0) return t('quota_summary.reset_soon');
    const totalMinutes = Math.round(diffMs / 60000);
    if (totalMinutes < 60) return t('quota_summary.resets_in_minutes', { count: totalMinutes });
    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;
    if (minutes === 0) return t('quota_summary.resets_in_hours', { count: hours });
    return t('quota_summary.resets_in_hours_minutes', { hours, minutes });
  } catch {
    return '';
  }
}

function getBarClass(remainingPct: number): string {
  if (remainingPct >= 70) return styles.high;
  if (remainingPct >= 30) return styles.medium;
  return styles.low;
}

function getDotColor(remainingPct: number): string {
  if (remainingPct >= 70) return 'var(--success-color, #22c55e)';
  if (remainingPct >= 30) return 'var(--quota-medium-color, #e0aa14)';
  return 'var(--danger-color)';
}

const WINDOW_LABELS: Record<string, string> = {
  five_hour: '5h',
  seven_day: '7d',
  seven_day_oauth_apps: '7d OAuth',
  seven_day_opus: '7d Opus',
  seven_day_sonnet: '7d Sonnet',
  seven_day_cowork: '7d Cowork',
  iguana_necktie: 'Iguana',
  tangelo: 'Tangelo',
  omelette_promotional: 'Promo',
  cinder_cove: 'Cinder',
  amber_ladder: 'Amber',
};

const PRIMARY_WINDOWS = ['five_hour', 'seven_day'];

function getScheme(provider: string) {
  const colors = TYPE_COLORS[provider] ?? TYPE_COLORS['unknown'];
  const isDark =
    document.documentElement.classList.contains('dark') ||
    window.matchMedia('(prefers-color-scheme: dark)').matches;
  return (isDark ? colors.dark : undefined) ?? colors.light;
}

function WindowBar({ label, window: w }: { label: string; window: QuotaWindow }) {
  const { t } = useTranslation();
  const remainingPct = Math.max(0, Math.min(100, 100 - w.utilization_pct));
  return (
    <div className={styles.windowItem}>
      <span className={styles.windowLabel}>{label}</span>
      <div className={styles.windowBar}>
        <div
          className={`${styles.windowBarFill} ${getBarClass(remainingPct)}`}
          style={{ width: `${remainingPct}%` }}
        />
      </div>
      <div className={styles.windowMeta}>
        <span className={styles.windowPct}>{Math.round(remainingPct)}%</span>
        {w.resets_at && (
          <span className={styles.windowReset}>{formatResetTime(w.resets_at, t)}</span>
        )}
      </div>
    </div>
  );
}

function ModelChips({ models }: { models: AntigravityModelEntry[] }) {
  const shown = models.slice(0, 6);
  const rest = models.length - shown.length;
  return (
    <div className={styles.modelsGrid}>
      {shown.map((m) => {
        const pct = Math.round(m.remaining_fraction * 100);
        return (
          <span key={m.id} className={styles.modelChip}>
            <span
              className={styles.modelChipDot}
              style={{ backgroundColor: getDotColor(pct) }}
            />
            {m.display_name || m.id}: {pct}%
          </span>
        );
      })}
      {rest > 0 && (
        <span className={styles.modelChip}>+{rest} more</span>
      )}
    </div>
  );
}

function CredentialRow({ entry }: { entry: QuotaFullEntry }) {
  const scheme = getScheme(entry.provider);

  const visibleWindows = entry.windows
    ? Object.entries(entry.windows)
        .filter(([, w]) => w !== null)
        .sort(([a], [b]) => {
          const ai = PRIMARY_WINDOWS.indexOf(a);
          const bi = PRIMARY_WINDOWS.indexOf(b);
          if (ai >= 0 && bi >= 0) return ai - bi;
          if (ai >= 0) return -1;
          if (bi >= 0) return 1;
          return a.localeCompare(b);
        }) as [string, QuotaWindow][]
    : [];

  return (
    <div className={styles.credentialRow}>
      <div className={styles.credentialHeader}>
        <span
          className={styles.providerBadge}
          style={{
            backgroundColor: scheme.bg,
            color: scheme.text,
            border: scheme.border ?? undefined,
          }}
        >
          {entry.provider}
        </span>
        {entry.plan_type && (
          <span className={styles.planBadge}>{entry.plan_type}</span>
        )}
        <span className={styles.credentialLabel}>{entry.label || entry.id}</span>
        {entry.error && (
          <span className={styles.credentialError}>{entry.error}</span>
        )}
      </div>

      {!entry.error && visibleWindows.length > 0 && (
        <div className={styles.windowsGrid}>
          {visibleWindows.map(([key, w]) => (
            <WindowBar key={key} label={WINDOW_LABELS[key] ?? key} window={w} />
          ))}
        </div>
      )}

      {!entry.error && entry.models && entry.models.length > 0 && (
        <ModelChips models={entry.models} />
      )}
    </div>
  );
}

export function QuotaFullSummarySection({ disabled }: Props) {
  const { t } = useTranslation();
  const [state, setState] = useState<LoadState>('idle');
  const [credentials, setCredentials] = useState<QuotaFullEntry[]>([]);
  const [fetchError, setFetchError] = useState('');
  const [fetchedAt, setFetchedAt] = useState<Date | null>(null);
  const [, setTick] = useState(0);
  const tickRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const load = useCallback(async () => {
    if (disabled) return;
    setState('loading');
    setFetchError('');
    try {
      const data = await quotaStatusFullApi.getAll();
      setCredentials(data.credentials ?? []);
      setFetchedAt(new Date());
      setState('success');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : t('notification.refresh_failed');
      setFetchError(msg);
      setState('error');
    }
  }, [disabled, t]);

  useEffect(() => {
    if (!disabled) {
      load();
    }
  }, [disabled, load]);

  useEffect(() => {
    if (!fetchedAt) return;
    tickRef.current = setInterval(() => setTick((n) => n + 1), 15000);
    return () => {
      if (tickRef.current) clearInterval(tickRef.current);
    };
  }, [fetchedAt]);

  return (
    <div className={styles.section}>
      <div className={styles.header}>
        <h2 className={styles.title}>{t('quota_summary.title')}</h2>
        {fetchedAt && (
          <span className={styles.fetchedAt}>
            {formatRelativeTime(fetchedAt, t)}
          </span>
        )}
        <button
          className={styles.refreshBtn}
          onClick={load}
          disabled={disabled || state === 'loading'}
          title={t('quota_summary.refresh')}
        >
          {state === 'loading' ? t('quota_summary.loading') : t('quota_summary.refresh')}
        </button>
      </div>

      <div className={styles.body}>
        {state === 'idle' && (
          <div className={styles.stateRow}>{t('quota_summary.idle')}</div>
        )}
        {state === 'loading' && (
          <div className={styles.stateRow}>{t('quota_summary.loading')}</div>
        )}
        {state === 'error' && (
          <div className={styles.errorRow}>
            {t('quota_summary.error', { message: fetchError })}
          </div>
        )}
        {state === 'success' && credentials.length === 0 && (
          <div className={styles.stateRow}>{t('quota_summary.empty')}</div>
        )}
        {state === 'success' &&
          credentials.map((entry) => (
            <CredentialRow key={entry.id} entry={entry} />
          ))}
      </div>
    </div>
  );
}
