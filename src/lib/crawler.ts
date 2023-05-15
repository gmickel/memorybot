import * as cheerio from 'cheerio';
import Crawler, { CrawlerRequestResponse } from 'crawler';
// import TurndownService from 'turndown';

// const turndownService = new TurndownService();

type ProgressCallback = (linksFound: number, linksCrawled: number, currentUrl: string) => void;

interface Page {
  url: string;
  text: string;
  title: string;
}

class WebCrawler {
  pages: Page[] = [];
  limit = 20;
  urls: string[] = [];
  count = 0;
  textLengthMinimum = 200;
  selector = 'body';
  progressCallback: ProgressCallback;
  crawler: Crawler;

  constructor(
    urls: string[],
    selector = 'body',
    limit = 20,
    textLengthMinimum = 200,
    progressCallback: ProgressCallback
  ) {
    this.urls = urls;
    this.selector = selector;
    this.limit = limit;
    this.textLengthMinimum = textLengthMinimum;
    this.progressCallback = progressCallback;
    this.count = 0;
    this.pages = [];
    this.crawler = new Crawler({
      maxConnections: 10,
      callback: this.handleRequest,
      userAgent: 'node-crawler',
    });
  }

  handleRequest = (error: Error | null, res: CrawlerRequestResponse, done: () => void) => {
    if (error) {
      console.error(error);
      done();
      return;
    }

    const $ = cheerio.load(res.body);
    // Remove obviously superfluous elements
    $('script').remove();
    $('header').remove();
    $('nav').remove();
    $('style').remove();
    $('img').remove();
    $('svg').remove();
    const title = $('title').text() || '';
    const text = $(this.selector).text();
    // const text = turndownService.turndown(html || '');

    const page: Page = {
      url: res.request.uri.href,
      text,
      title,
    };
    if (text.length > this.textLengthMinimum) {
      this.pages.push(page);
      this.progressCallback(this.count + 1, this.pages.length, res.request.uri.href);
    }

    $('a').each((_i: number, elem: any) => {
      if (this.count >= this.limit) {
        return false; // Stop iterating once the limit is reached
      }

      const href = $(elem).attr('href')?.split('#')[0];
      const url = href && (res.request.uri as any).resolve(href);
      // crawl more
      if (url && this.urls.some((u) => url.includes(u))) {
        this.crawler.queue(url);
        this.count += 1;
      }
      return true; // Continue iterating when the limit is not reached
    });

    done();
  };

  start = async () => {
    this.pages = [];
    return new Promise((resolve, _reject) => {
      this.crawler.on('drain', () => {
        resolve(this.pages);
      });
      this.urls.forEach((url) => {
        this.crawler.queue(url);
      });
    });
  };
}

export { WebCrawler };
