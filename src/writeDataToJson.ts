import { writeFile } from 'mz/fs';
import pMap from 'p-map';
import * as path from 'path';
import { Channel, extractPropertyInformation, loadProperties } from './real-estate-api';

async function loadAllInformation() {
  const pageSize = 1000;
  const channel = Channel.rent;

  // Load the first page
  console.log('Loading first page');
  const firstPageResults = await loadProperties({ pageSize, channel, page: 1 });
  const records = extractPropertyInformation(firstPageResults);

  // Calculate the total number of pages
  const pages = Math.ceil(firstPageResults.totalResultsCount / pageSize);
  console.log(`Total pages ${pages} (${firstPageResults.totalResultsCount} properties)`);

  // Load the remaining pages simultaneously
  return records.concat(...(await pMap(
    Array(pages - 1).fill(0),
    async (_, page) => {
      console.log('Loading page', page + 2);
      return extractPropertyInformation(
        await loadProperties({ pageSize, channel, page: page + 2 })
      );
    },
    { concurrency: 20 },
  )));
}

async function main() {
  const data = await loadAllInformation();
  await writeFile(path.resolve('output', 'data.json'), JSON.stringify(data));
}

main();
