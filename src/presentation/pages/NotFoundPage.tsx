import { Link } from 'react-router';
import { ArrowRightIcon, CompassIcon } from '@phosphor-icons/react';
import { usePageTitle } from '../state/store';
export function NotFoundPage({
  title = 'This page wandered off.',
  message = 'The page you’re looking for doesn’t exist or has moved.',
}: {
  title?: string;
  message?: string;
}) {
  usePageTitle('Not found');
  return (
    <div className="container page">
      <div className="empty-state page-empty">
        <CompassIcon size={48} weight="light" />
        <h1 className="page-title">{title}</h1>
        <p>{message}</p>
        <Link className="pill dark" to="/shop">
          Explore the collection
          <ArrowRightIcon size={16} />
        </Link>
      </div>
    </div>
  );
}
