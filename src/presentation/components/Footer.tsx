import { useState, type FormEvent } from 'react';
import { Link } from 'react-router';
import {
  ArrowRightIcon,
  InstagramLogoIcon,
  YoutubeLogoIcon,
  TiktokLogoIcon,
  SpotifyLogoIcon,
  CheckIcon,
} from '@phosphor-icons/react';
import { errorDetails, useServices } from '../state/services';
import { useStore } from '../state/store';
import { infoPages } from '../pages/infoContent';
export function Footer() {
  const { newsletter } = useServices();
  const { showToast } = useStore();
  const [status, setStatus] = useState<'idle' | 'sending' | 'subscribed'>(
    'idle',
  );
  const [email, setEmail] = useState('');
  const subscribed = status === 'subscribed';
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!event.currentTarget.checkValidity() || status !== 'idle') return;
    setStatus('sending');
    try {
      await newsletter.subscribe(email.trim());
      setStatus('subscribed');
      showToast('You’re on the list. A brighter inbox awaits.');
    } catch (error) {
      setStatus('idle');
      showToast(errorDetails(error).message);
    }
  }
  return (
    <footer className="footer">
      <div className="container footer-top">
        <div className="footer-brand">
          <Link className="wordmark" to="/">
            NEXORA
          </Link>
          <p>A brighter everyday.</p>
        </div>
        <nav aria-label="Footer navigation">
          <Link to="/shop">Shop</Link>
          {infoPages.map((page) => (
            <Link key={page.slug} to={`/${page.slug}`}>
              {page.label}
            </Link>
          ))}
        </nav>
        <form className="newsletter" onSubmit={submit}>
          <label htmlFor="newsletter-email">
            {subscribed ? 'Thanks for joining us.' : 'Join a brighter inbox'}
          </label>
          <div>
            <input
              id="newsletter-email"
              type="email"
              required
              disabled={status !== 'idle'}
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="Your email address"
              autoComplete="email"
            />
            <button
              type="submit"
              disabled={status !== 'idle'}
              aria-label="Subscribe to newsletter"
            >
              {subscribed ? (
                <CheckIcon size={16} />
              ) : (
                <ArrowRightIcon size={16} />
              )}
            </button>
          </div>
        </form>
        <div className="socials">
          {[
            [InstagramLogoIcon, 'Instagram'],
            [YoutubeLogoIcon, 'YouTube'],
            [TiktokLogoIcon, 'TikTok'],
            [SpotifyLogoIcon, 'Spotify'],
          ].map(([Icon, label]) => {
            const SocialIcon = Icon as typeof InstagramLogoIcon;
            return (
              <button
                key={label as string}
                aria-label={label as string}
                onClick={() =>
                  showToast(`Our ${label as string} community is coming soon.`)
                }
              >
                <SocialIcon size={16} />
              </button>
            );
          })}
        </div>
      </div>
      <div className="container footer-bottom">
        <span>© {new Date().getFullYear()} NEXORA. All rights reserved.</span>
        <span>Live Brighter. Shop Smarter.</span>
      </div>
    </footer>
  );
}
