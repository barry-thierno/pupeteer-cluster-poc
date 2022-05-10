import { Cluster } from "puppeteer-cluster";
import { TaskFunction } from "puppeteer-cluster/dist/Cluster";

type PageOption = {
  name: string;
  url: string;
};

const CAPTURE_URLS: PageOption[] = [
  { name: "github", url: "https://github.com/" },
  { name: "google", url: "https://www.google.com/" },
  { name: "stackoverflow", url: "https://stackoverflow.com/" },
  { name: "medium", url: "https://medium.com/" },
  { name: "wikipedia", url: "https://www.wikipedia.org/" },
  { name: "decathlon", url: "https://decathlon.com/" },
  { name: "amazon", url: "https://www.amazon.fr/" },
  { name: "carrefour", url: "https://www.carrefour.fr/" },
];

// create cluster
const cluster: Cluster<string, number> = await Cluster.launch({
  concurrency: Cluster.CONCURRENCY_PAGE,
  maxConcurrency: 8,
  monitor: true,
  puppeteerOptions: {
    headless: true,
  },
});

const captureAsPdf: TaskFunction<PageOption, number> = async (captueOption) => {
  const {
    page,
    data: { name, url },
    worker,
  } = captueOption;

  console.log("Capturing by Worker " + worker.id);
  await page.goto(url);
  await page.pdf({
    path: `./pdfs/${name}-${worker.id}.pdf`,
  });
  return 1;
};

// error handling
cluster.on("taskerror", (err: Error, data: PageOption, willRetry: boolean) => {
  if (willRetry) {
    console.warn(
      `Encountered an error while crawling ${data}. ${err.message}\nThis job will be retried`
    );
  } else {
    console.error(`Failed to crawl ${data}: ${err.message}`);
  }
});

// queue all tasks
for (const data of CAPTURE_URLS) {
  cluster.queue((x) => captureAsPdf({ ...x, data }));
}

await cluster.idle();

await cluster.close();
