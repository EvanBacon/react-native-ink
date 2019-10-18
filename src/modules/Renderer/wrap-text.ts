import wrapAnsi from 'wrap-ansi';
import cliTruncate from 'cli-truncate';

export default (
  text: string,
  maxWidth: number,
  { textWrap }: { textWrap?: string } = {},
) => {
  if (textWrap === 'wrap') {
    return wrapAnsi(text, maxWidth, {
      trim: false,
      hard: true,
    });
  }

  if (String(textWrap).startsWith('truncate')) {
    let position: 'start' | 'middle' | 'end';

    if (textWrap === 'truncate-middle') {
      position = 'middle';
    } else if (textWrap === 'truncate-start') {
      position = 'start';
    } else if (textWrap === 'truncate' || textWrap === 'truncate-end') {
      position = 'end';
    } else {
      position = 'end';
    }

    return cliTruncate(text, maxWidth, { position });
  }

  return text;
};
