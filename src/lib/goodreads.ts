import { XMLParser } from 'fast-xml-parser';

const GOODREADS_USER_ID = '198954569';
const parser = new XMLParser();

export interface Book {
  title: string;
  author: string;
  cover: string;
  rating: number;
  averageRating: number;
  pages: number;
  link: string;
  review: string;
}

async function fetchShelf(shelf: string): Promise<Book[]> {
  const url = `https://www.goodreads.com/review/list_rss/${GOODREADS_USER_ID}?shelf=${shelf}`;
  const res = await fetch(url);
  if (!res.ok) return [];

  const xml = await res.text();
  const data = parser.parse(xml);
  const items = data?.rss?.channel?.item;

  if (!items) return [];
  const list = Array.isArray(items) ? items : [items];

  return list.map((item: any) => ({
    title: cleanTitle(item.title ?? ''),
    author: item.author_name ?? '',
    cover: item.book_large_image_url || item.book_medium_image_url || item.book_image_url || '',
    rating: Number(item.user_rating) || 0,
    averageRating: Number(item.average_rating) || 0,
    pages: Number(item.num_pages) || 0,
    link: item.link ?? '',
    review: stripHtml(item.user_review ?? ''),
  }));
}

function stripHtml(html: string): string {
  return html.replace(/<[^>]*>/g, '').trim();
}

function cleanTitle(title: string): string {
  // Remove series info in parentheses like "(The Stormlight Archive, #1)"
  return title.replace(/\s*\(.*?\)\s*$/, '').trim();
}

export async function getBooks() {
  const [reading, read, toRead] = await Promise.all([
    fetchShelf('currently-reading'),
    fetchShelf('read'),
    fetchShelf('to-read'),
  ]);

  return { reading, read, toRead };
}
