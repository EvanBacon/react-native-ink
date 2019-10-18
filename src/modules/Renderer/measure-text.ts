import widestLine from 'widest-line';

export default (text: string): { width: number; height: number } => {
  const width = widestLine(text);
  const height = text.split('\n').length;

  return { width, height };
};
