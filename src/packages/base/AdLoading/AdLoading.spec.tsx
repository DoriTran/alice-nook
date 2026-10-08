import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';

import AdLoading from './AdLoading';
import AdPageLoading from './AdPageLoading';

describe('AdLoading', () => {
  it('renders an accessible icon-only loader at the default size', () => {
    const html = renderToStaticMarkup(<AdLoading />);

    expect(html).toContain('role="status"');
    expect(html).toContain('aria-label="Loading…"');
    expect(html).toContain('aria-busy="true"');
    expect(html).toContain('data-size="sm"');
    expect(html).toContain('aria-hidden="true"');
  });

  it('renders a visible message without a duplicate aria label', () => {
    const html = renderToStaticMarkup(
      <AdLoading message="Arranging notes…" size="lg" />,
    );

    expect(html).toContain('data-size="lg"');
    expect(html).toContain('Arranging notes…');
    expect(html).not.toContain('aria-label=');
  });
});

describe('AdPageLoading', () => {
  it('renders the branded default loading message', () => {
    const html = renderToStaticMarkup(<AdPageLoading />);

    expect(html).toContain('role="status"');
    expect(html).toContain('Opening your nook');
    expect(html).not.toContain('Opening your nook…');
    expect(html.match(/data-loading-flower=/g)).toHaveLength(3);
    expect(html).toContain('data-variant="page"');
    expect(html).toContain('aria-hidden="true"');
  });

  it('supports a custom page loading message', () => {
    const html = renderToStaticMarkup(
      <AdPageLoading message="Opening your diary" />,
    );

    expect(html).toContain('Opening your diary');
  });
});
