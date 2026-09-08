import { useState } from 'preact/hooks';
import { supabase } from '../../lib/supabase';

type Status = 'idle' | 'submitting' | 'success' | 'error';

interface Props {
  variant?: 'hero' | 'section';
}

export default function WaitlistForm({ variant = 'section' }: Props) {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<Status>('idle');
  const [errorMessage, setErrorMessage] = useState('');

  async function handleSubmit(event: Event) {
    event.preventDefault();
    if (status === 'submitting') return;
    setStatus('submitting');
    setErrorMessage('');

    const { data, error } = await supabase.functions.invoke('waitlist-signup', {
      body: { email },
    });

    if (error || !data?.success) {
      setStatus('error');
      setErrorMessage('Das hat leider nicht geklappt. Bitte versuch es gleich noch einmal.');
      return;
    }

    setStatus('success');
  }

  if (status === 'success') {
    return (
      <p class="rounded-xl border border-ember/30 bg-ember/10 px-5 py-4 text-sm font-medium text-cream">
        Danke! Du bekommst eine Nachricht, sobald KinoLiebe im Play Store startet.
      </p>
    );
  }

  return (
    <div>
      <form onSubmit={handleSubmit} class="flex flex-col gap-3 sm:flex-row">
        <label class="sr-only" for={`waitlist-email-${variant}`}>
          E-Mail-Adresse
        </label>
        <input
          id={`waitlist-email-${variant}`}
          type="email"
          required
          autocomplete="email"
          placeholder="deine@email.de"
          value={email}
          onInput={(e) => setEmail((e.target as HTMLInputElement).value)}
          class="w-full flex-1 rounded-full border border-white/10 bg-white/5 px-5 py-3.5 text-cream placeholder:text-mist/60 outline-none focus:border-ember/60 sm:min-w-[280px]"
        />
        <button
          type="submit"
          disabled={status === 'submitting'}
          class="shrink-0 rounded-full bg-ember px-6 py-3.5 font-semibold text-cream transition-colors hover:bg-ember-light disabled:opacity-60"
        >
          {status === 'submitting' ? 'Wird eingetragen…' : 'Zur Warteliste'}
        </button>
      </form>
      {status === 'error' && <p class="mt-2 text-sm text-red-400">{errorMessage}</p>}
    </div>
  );
}
