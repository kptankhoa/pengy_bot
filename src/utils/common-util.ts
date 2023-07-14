import { URL_REGEX } from 'const/common';

export const isUrl = (str: string) => URL_REGEX.test(str);

export const stripVietnameseAccent = (str: string) => {
  const from = 'àáãảạăằắẳẵặâầấẩẫậèéẻẽẹêềếểễệđùúủũụưừứửữựòóỏõọôồốổỗộơờớởỡợìíỉĩịäëïîöüûñçýỳỹỵỷ',
    to   = 'aaaaaaaaaaaaaaaaaeeeeeeeeeeeduuuuuuuuuuuoooooooooooooooooiiiiiaeiiouuncyyyyy';
  for (let i=0, l=from.length ; i < l ; i++) {
    str = str.replace(RegExp(from[i], 'gi'), to[i]);
  }

  str = str
    .trim()
    .replace(/[^a-zA-Z0-9\-_]/g, '-');

  return str;
};

export const getName = (name: string) => {
  return stripVietnameseAccent(name.split(' ')[0]);
};
