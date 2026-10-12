import { Link } from 'react-router';
import { ArrowRightIcon } from '@phosphor-icons/react';
import { usePageTitle } from '../state/store';
import type { InfoPageContent } from './infoContent';
export function InfoPage({ page }: { page: InfoPageContent }) {
  usePageTitle(page.label);
  return (
    <div className="container page info-page">
      <p className="eyebrow">{page.eyebrow}</p>
      <h1 className="page-title">{page.heading}</h1>
      {page.body.map((paragraph) => (
        <p key={paragraph} className="page-lead">
          {paragraph}
        </p>
      ))}
      <Link className="pill dark" to={page.cta.to}>
        {page.cta.label}
        <ArrowRightIcon size={16} />
      </Link>
    </div>
  );
}
