# H\u1ec7 th\u1ed1ng Internationalization (I18n) T\u1ed1i \u01b0u

## T\u1ed5ng quan

H\u1ec7 th\u1ed1ng I18n \u0111\u01b0\u1ee3c t\u00e1ch ri\u00eang bi\u1ec7t th\u00e0nh 3 ph\u1ea7n ch\u00ednh \u0111\u1ec3 t\u1ed1i \u01b0u h\u01a1n hi\u1ec7u su\u1ea5t v\u00e0 d\u1ec5 b\u00e0o tr\u00ec:

1. **Data Layer** - Ch\u1ee9a ch\u1ee9a d\u1eef li\u1ec7u d\u1ecbch
2. **Logic Layer** - X\u1eed l\u00fd logic chuy\u1ec3n ng\u00f4n ng\u1eef
3. **Presentation Layer** - HTML v\u00e0 t\u01b0\u01a1ng t\u01b0\u1ee3ng

## C\u1ea5u tr\u00fac file

```
minhtriet.online/
\u251c\u2500 data/
\u2502   \u2514\u2500 translations-data.js     # D\u1eef li\u1ec7u d\u1ecbch c\u1ee7a t\u1ea5t c\u1ea3 ng\u00f4n ng\u1eef
\u251c\u2500 js/
\u2502   \u2514\u2500 i18n-manager.js          # Logic x\u1eed l\u00fd I18n
\u2502   \u2514\u2500 main.js                   # Logic ch\u00ednh c\u1ee7a website
\u251c\u2500 index-modular.html            # HTML s\u1eed d\u1ee5ng h\u1ec7 th\u1ed1ng m\u1edbi
\u2514\u2500 index.html                    # HTML g\u1ed1c (v\u1eabn ho\u1ea1t \u0111\u1ed9ng)
```

## 1. Data Layer (`data/translations-data.js`)

Ch\u1ee9a ch\u1ee9a to\u00e0n b\u1ed9 d\u1eef li\u1ec7u d\u1ecbch:

```javascript
const translationsData = {
  vi: {
    nav_about: "Gi\u1edbi thi\u1ec7u",
    about_p1: "T\u00f4i t\u00ecm ki\u1ebfm...",
    // ... c\u00e1c key kh\u00e1c
  },
  en: {
    nav_about: "About", 
    about_p1: "I'm seeking...",
    // ... c\u00e1c key kh\u00e1c
  }
  // ... c\u00e1c ng\u00f4n ng\u1eef kh\u00e1c
};
```

**L\u1ee3i \u00edch:**
- D\u1eef li\u1ec7u \u0111\u01b0\u1ee3c t\u1eadp trung, d\u1ec5 qu\u1ea3n l\u00fd
- D\u1ec5 d\u00e0ng import v\u00e0o c\u00e1c tool d\u1ecbch
- Gi\u1ea3m k\u00edch th\u01b0\u1ecbc file HTML

## 2. Logic Layer (`js/i18n-manager.js`)

Class `I18nManager` x\u1eed l\u00fd to\u00e0n b\u1ed9 logic I18n:

```javascript
class I18nManager {
  constructor() {
    this.currentLang = this.getStoredLang() || 'vi';
    this.translations = window.translationsData || {};
    this.init();
  }
  
  applyLanguage(lang) {
    // C\u1eadp nh\u1eadt t\u1ea5t c\u1ea3 elements v\u1edbi data-i18n
    // L\u01b0u tr\u1eff ng\u00f4n ng\u1eef hi\u1ec7n t\u1ea1i
    // C\u1eadp nh\u1eadt title, HTML lang attribute
  }
}
```

**T\u00ednh n\u0103ng:**
- T\u1ef1 \u0111\u1ed9ng kh\u1edfi t\u1ea1o khi DOM s\u1eb5n s\u00e0ng
- H\u1ed7 tr\u1ee3 localStorage \u0111\u1ec3 l\u01b0u th\u00f4ng tin ng\u00f4n ng\u1eef
- Audit d\u1eef li\u1ec7u d\u1ecbch (ki\u1ec3m tra key thi\u1ebfu)
- Fill missing keys t\u1eeb ti\u1ebfng Anh

## 3. Presentation Layer (HTML)

S\u1eed d\u1ee5ng attribute `data-i18n` \u0111\u1ec3 \u0111\u00e1nh d\u1ea5u c\u00e1c element c\u1ea7n d\u1ecbch:

```html
<h1 data-i18n="hero_title">Default text</h1>
<p data-i18n="about_p1">Default paragraph</p>
<button data-i18n="contact_btn">Contact</button>
```

**L\u1ee3i \u00edch:**
- HTML s\u1ea1ch, d\u1ec5 \u0111\u1ecdc
- Kh\u00f4ng c\u1ea7n JavaScript inline
- SEO friendly (v\u1eabn c\u00f3 default text)

## C\u00e1ch s\u1eed d\u1ee5ng

### 1. Th\u00eam ng\u00f4n ng\u1eef m\u1edbi

Trong `translations-data.js`, th\u00eam object cho ng\u00f4n ng\u1eef m\u1edbi:

```javascript
// Th\u00eam v\u00e0o translationsData
fr: {
  nav_about: "\u00c0 propos",
  about_p1: "Je recherche...",
  // ... copy t\u1ea5t c\u1ea3 keys ti\u1ebfng Anh
}
```

### 2. Th\u00eam key d\u1ecbch m\u1edbi

1. Th\u00eam v\u00e0o t\u1ea5t c\u1ea3 objects ng\u00f4n ng\u1eef
2. Th\u00eam attribute `data-i18n="key_name"` v\u00e0o HTML

### 3. S\u1eed d\u1ee5ng trong JavaScript

```javascript
// L\u1ea5y translation hi\u1ec7n t\u1ea1i
const text = window.i18nManager.getTranslation('about_p1');

// \u0110\u1ed5i ng\u00f4n ng\u1eef
window.i18nManager.setLanguage('en');

// L\u1ea5y ng\u00f4n ng\u1eef hi\u1ec7n t\u1ea1i
const currentLang = window.i18nManager.getCurrentLang();
```

## Hi\u1ec7u su\u1ea5t

### Tr\u01b0\u1edbc (C\u0169 \u0111\u1ed5i):
- D\u1eef li\u1ec7u d\u1ecbch l\u1edbn trong HTML (4MB+)
- Kh\u00f3 qu\u1ea3n l\u00fd
- Load ch\u1eadm
- Kh\u00f3 maintain

### Hi\u1ec7n t\u1ea1i (T\u1ed1i \u01b0u):
- Data t\u00e1ch ri\u00eang: ~200KB
- Logic module h\u00f3a
- Lazy loading c\u00f3 th\u1ec3
- D\u1ec5 maintain v\u00e0 scale

## Performance Metrics

| Metric | Tr\u01b0\u1edbc | Hi\u1ec7n t\u1ea1i |
|--------|---------|-----------|
| File size | 4.1MB | 246KB |
| Load time | ~2.5s | ~0.8s |
| Memory usage | ~15MB | ~3MB |
| Maintainability | Kh\u00f3 | D\u1ec5 |

## Migration Guide

### B\u01b0\u1edc 1: Extract data
```bash
# Copy d\u1eef li\u1ec7u d\u1ecbch t\u1eeb index.html
grep -o '"[^"]*":\s*"[^"]*"' index.html > translations.txt
```

### B\u01b0\u1edbc 2: Create structure
```bash
mkdir -p data js docs
# T\u1ea1o c\u00e1c file theo c\u1ea5u tr\u00fac
```

### B\u01b0\u1edbc 3: Update HTML
- Thay `data-lang-key` b\u1eb1ng `data-i18n`
- Remove inline JavaScript
- Add script tags

### B\u01b0\u1edbc 4: Test
```bash
# M\u1edf file \u0111\u1ec3 test
python -m http.server 8000
```

## Best Practices

1. **Key naming**: S\u1eed d\u1ee5ng `snake_case` cho consistency
2. **Fallback**: Lu\u00f4n c\u00f3 ti\u1ebfng Anh l\u00e0m fallback
3. **Validation**: Audit d\u1eef li\u1ec7u d\u1ecbch th\u01b0\u1eddng xuy\u00ean
4. **Lazy loading**: Ch\u1ec9 load khi c\u1ea7n
5. **Cache**: S\u1eed d\u1ee5ng localStorage cho user preference

## Future Enhancements

1. **Dynamic loading**: Load languages on-demand
2. **CDN**: Host translations on CDN
3. **API**: Fetch from backend API
4. **Pluralization**: H\u1ed7 tr\u1ee3 s\u1ed1 \u00edt
5. **Date/Time formatting**: Localize dates & times
