// This file is required for Expo/React Native SQLite migrations - https://orm.drizzle.team/quick-sqlite/expo

import journal from './meta/_journal.json';
import m0000 from './0000_nosy_overlord.sql';
import m0001 from './0001_warm_azazel.sql';
import m0002 from './0002_easy_paibok.sql';

  export default {
    journal,
    migrations: {
      m0000,
m0001,
m0002
    }
  }
  