import { FilterXSS } from 'xss';

/**
 * Strips HTML tags from request body strings (defense in depth for print/PDF output).
 * Plain characters like "<" or "&" are kept.
 */
const filter = new FilterXSS({
  whiteList: {},
  stripIgnoreTag: true,
  stripIgnoreTagBody: ['script', 'style', 'iframe', 'object'],
  escapeHtml: (html) => html,
});

function clean(value) {
  if (typeof value === 'string') return filter.process(value);
  if (Array.isArray(value)) return value.map(clean);
  if (value && typeof value === 'object') {
    for (const key of Object.keys(value)) value[key] = clean(value[key]);
    return value;
  }
  return value;
}

export function xssSanitizer(req, _res, next) {
  if (req.body && typeof req.body === 'object') req.body = clean(req.body);
  next();
}
