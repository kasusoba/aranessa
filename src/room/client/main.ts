// The room in the browser. Listeners that react to a view opening go first, so a page that lands with a door open
// (strip() announces it) gets them too.
import { ledge } from "./ledge";
import { listen } from "./listen";
import { live } from "./live";
import { swing } from "./me";
import { pickers } from "./pick";
import { read } from "./read";
import { scrub } from "./scrub";
import { shows } from "./shows";
import { strip } from "./strip";
import { keepFresh } from "./time";
import { views } from "./views";
import { watch } from "./watch";

views();
listen();
watch();
read();
pickers(".pd-tune, .sd-tune", ".pv-tune, .shv-tune");
shows();
swing();
scrub();
live();
keepFresh();
strip(ledge());
