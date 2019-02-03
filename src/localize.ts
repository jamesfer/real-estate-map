import { writeFile } from 'mz/fs';
import * as path from 'path';
import data from '../output/data.json';

const longitudeRange = [144.5, 145.5];
const latitudeRange = [-38, -37];
const locale = 'melbourne';

const localProperties = data.filter(({ latitude, longitude }: { latitude: number, longitude: number }) => (
  latitude >= latitudeRange[0] && latitude < latitudeRange[1]
    && longitude >= longitudeRange[0] && longitude < longitudeRange[1]
));
writeFile(path.resolve('output', `${locale}.json`), JSON.stringify(localProperties));
