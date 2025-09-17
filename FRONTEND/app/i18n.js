
import i18next from 'i18next';
import { initReactI18next } from 'react-i18next';
import en from '../messages/en.json';
import hi from '../messages/hi.json';
import as from '../messages/as.json';
import bn from '../messages/bn.json';
import gu from '../messages/gu.json';
import ta from '../messages/ta.json';
import te from '../messages/te.json';
import kn from '../messages/kn.json';
import ml from '../messages/ml.json';
import mr from '../messages/mr.json';
import or from '../messages/or.json';
import pa from '../messages/pa.json';

const resources = {
  en: { translation: en },
  hi: { translation: hi },
  as: { translation: as },
  bn: { translation: bn },
  gu: { translation: gu },
  ta: { translation: ta },
  te: { translation: te },
  kn: { translation: kn },
  ml: { translation: ml },
  mr: { translation: mr },
  or: { translation: or },
  pa: { translation: pa },
};

i18next
  .use(initReactI18next)
  .init({
    resources,
    lng: 'en',
    fallbackLng: 'en',
    interpolation: { escapeValue: false },
    react: { useSuspense: false },
  });

export default i18next;
