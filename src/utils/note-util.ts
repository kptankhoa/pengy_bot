import { Note } from 'models';

export const printNotes = (notes: Note[]) => notes
  .map(({ content, madeBy }, index) => `${index + 1}. ${madeBy}: ${content}`)
  .join('\n');
