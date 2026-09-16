import { promises as fs } from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const cvPath = path.join(root, 'public', 'cv-online.html');

const apps = [
  {
    name: 'BLedger — Sổ Kinh Doanh',
    url: 'https://bled.ivstech.store/',
    logo: 'https://bled.ivstech.store/logo.png',
    vi: 'Quản lý kinh doanh',
    en: 'Business management'
  },
  {
    name: 'Booking Ops',
    url: 'https://booking-ops.web.app/',
    logo: 'https://booking-ops.web.app/images/logo.png',
    vi: 'Booking & vận hành nhà hàng',
    en: 'Booking & restaurant operations'
  },
  {
    name: 'WMS by IVS',
    url: 'https://wms-byivs.web.app/dashboard',
    logo: 'https://wms-byivs.web.app/icons/icon-48.png',
    vi: 'Quản lý kho thông minh',
    en: 'Smart warehouse management'
  },
  {
    name: 'CenterCare by IVS',
    url: 'https://center.ivslearning.io.vn/login',
    logo: 'https://center.ivslearning.io.vn/logo-512.png',
    vi: 'Quản lý trung tâm',
    en: 'Education center management'
  }
];

const css = `
    /* CV_LIVE_APPS_START */
    .live-apps-block {
      margin-top: 28px;
      padding-top: 24px;
      border-top: 1px solid var(--line);
    }
    .live-apps-head {
      display: flex;
      align-items: end;
      justify-content: space-between;
      gap: 18px;
      margin-bottom: 16px;
    }
    .live-apps-head h3 {
      margin: 0;
      color: var(--navy);
      font-size: 21px;
      line-height: 1.15;
    }
    .live-apps-head p {
      margin: 5px 0 0;
      color: var(--muted);
      font-size: 14.5px;
      line-height: 1.45;
    }
    .live-apps-grid {
      display: grid;
      grid-template-columns: repeat(4, minmax(0, 1fr));
      gap: 14px;
    }
    .live-app-card {
      display: flex;
      align-items: center;
      min-width: 0;
      gap: 13px;
      padding: 14px;
      color: var(--ink);
      background: linear-gradient(180deg, #fff, var(--soft));
      border: 1px solid var(--line);
      border-radius: var(--radius-md);
      text-decoration: none;
      transition: transform .18s ease, box-shadow .18s ease, border-color .18s ease;
      break-inside: avoid;
    }
    .live-app-card:hover {
      transform: translateY(-2px);
      box-shadow: 0 14px 30px rgba(23,58,94,.09);
      border-color: rgba(184,135,70,.42);
    }
    .live-app-logo {
      width: 58px;
      height: 58px;
      flex: 0 0 58px;
      display: grid;
      place-items: center;
      padding: 7px;
      background: #fff;
      border: 1px solid rgba(23,58,94,.10);
      border-radius: 14px;
      overflow: hidden;
    }
    .live-app-logo img {
      display: block;
      width: 100%;
      height: 100%;
      object-fit: contain;
    }
    .live-app-meta {
      min-width: 0;
      display: grid;
      gap: 4px;
    }
    .live-app-name {
      color: var(--navy);
      font-size: 15.5px;
      font-weight: 800;
      line-height: 1.25;
      font-family: var(--font-sans);
    }
    .live-app-type {
      color: var(--muted);
      font-size: 12.5px;
      line-height: 1.35;
      font-family: var(--font-sans);
    }
    .live-app-open {
      color: var(--gold);
      font-size: 12px;
      font-weight: 800;
      letter-spacing: .02em;
      font-family: var(--font-sans);
    }
    @media (max-width: 980px) {
      .live-apps-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); }
    }
    @media (max-width: 560px) {
      .live-apps-head { align-items: start; flex-direction: column; }
      .live-apps-grid { grid-template-columns: 1fr; }
      .live-app-card { padding: 13px; }
    }
    @media print {
      .live-apps-grid { grid-template-columns: repeat(2, 1fr); }
      .live-app-card { box-shadow: none; }
    }
    /* CV_LIVE_APPS_END */
`;

function renderApps(lang) {
  const isVi = lang === 'vi';
  const title = isVi ? 'Ứng dụng đang vận hành' : 'Live Applications';
  const note = isVi
    ? 'Các sản phẩm có thể mở trực tiếp để xem trải nghiệm vận hành thực tế.'
    : 'Production applications that can be opened directly to review the live operational experience.';
  const open = isVi ? 'Mở ứng dụng ↗' : 'Open app ↗';

  const cards = apps.map((app) => `
            <a class="live-app-card" href="${app.url}" target="_blank" rel="noopener noreferrer">
              <span class="live-app-logo"><img src="${app.logo}" alt="${app.name} logo" width="58" height="58" loading="lazy"></span>
              <span class="live-app-meta">
                <span class="live-app-name">${app.name}</span>
                <span class="live-app-type">${app[lang]}</span>
                <span class="live-app-open">${open}</span>
              </span>
            </a>`).join('');

  return `
          <div class="live-apps-block" data-live-apps="${lang}">
            <div class="live-apps-head">
              <div>
                <h3>${title}</h3>
                <p>${note}</p>
              </div>
            </div>
            <div class="live-apps-grid">${cards}
            </div>
          </div>
`;
}

function insertBeforeSectionClose(html, marker, fragment, guard) {
  if (html.includes(guard)) return html;
  const markerIndex = html.indexOf(marker);
  if (markerIndex < 0) throw new Error(`CV insertion marker not found: ${marker}`);
  const sectionCloseIndex = html.lastIndexOf('</section>', markerIndex);
  if (sectionCloseIndex < 0) throw new Error(`Section closing tag not found before marker: ${marker}`);
  return `${html.slice(0, sectionCloseIndex)}${fragment}        ${html.slice(sectionCloseIndex)}`;
}

let html = await fs.readFile(cvPath, 'utf8');

if (!html.includes('CV_LIVE_APPS_START')) {
  const styleClose = html.indexOf('</style>');
  if (styleClose < 0) throw new Error('CV style closing tag not found');
  html = `${html.slice(0, styleClose)}${css}  ${html.slice(styleClose)}`;
}

html = insertBeforeSectionClose(
  html,
  '<!-- 05 / Học vấn & Chứng chỉ -->',
  renderApps('vi'),
  'data-live-apps="vi"'
);

html = insertBeforeSectionClose(
  html,
  '<!-- 05 / Education & Certifications -->',
  renderApps('en'),
  'data-live-apps="en"'
);

await fs.writeFile(cvPath, html);
console.log('Injected live application cards into public/cv-online.html');
