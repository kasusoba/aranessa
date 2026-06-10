const HARDCOVER_API_BASE = "https://api.hardcover.app/v1/graphql";

export interface HardcoverReading {
	id: number;
	title: string;
	image: string | null;
	url: string;
	progress: string; // e.g. "63%" or "p120"
	date: Date;
}

export interface HardcoverReview {
	id: number;
	title: string;
	image: string | null;
	url: string;
	rating: string; // e.g. "4.5/5", "" if unrated
	note: string;
	spoiler: boolean;
	hasReview: boolean;
	date: Date;
}

// The token in HARDCOVER_TOKEN already includes the "Bearer " prefix.
async function hardcoverRequest(
	query: string,
	// biome-ignore lint/suspicious/noExplicitAny: graphql response is arbitrary
): Promise<any | null> {
	const token = import.meta.env.HARDCOVER_TOKEN;
	if (!token) return null;
	try {
		const res = await fetch(HARDCOVER_API_BASE, {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
				Authorization: token,
			},
			body: JSON.stringify({ query }),
		});
		const json = await res.json();
		if (json.errors) {
			console.error("Hardcover API errors:", json.errors);
			return null;
		}
		return json.data;
	} catch (e) {
		console.error("Failed to fetch from Hardcover:", e);
		return null;
	}
}

// biome-ignore lint/suspicious/noExplicitAny: hardcover book payload is loosely typed
function bookImage(book: any): string | null {
	return book?.image?.url ?? book?.cached_image?.url ?? null;
}

// biome-ignore lint/suspicious/noExplicitAny: hardcover book payload is loosely typed
function bookUrl(book: any): string {
	return `https://hardcover.app/books/${book?.slug ?? ""}`;
}

// Currently-reading books, for the recent strip — newest activity first.
export async function getHardcoverReading(): Promise<HardcoverReading[]> {
	const data = await hardcoverRequest(`
    query {
      me {
        user_books(
          where: { status_id: { _eq: 2 } }
          order_by: { last_read_date: desc_nulls_last }
          limit: 20
        ) {
          id
          last_read_date
          date_added
          book { id title slug image { url } cached_image }
          user_book_reads(order_by: { id: desc }, limit: 1) {
            progress
            progress_pages
            edition { pages }
          }
        }
      }
    }
  `);

	const rows = data?.me?.[0]?.user_books ?? [];
	// biome-ignore lint/suspicious/noExplicitAny: hardcover row is loosely typed
	return rows.map((row: any): HardcoverReading => {
		const read = row.user_book_reads?.[0];
		const rawPct =
			read?.progress ??
			(read?.progress_pages && read?.edition?.pages
				? (read.progress_pages / read.edition.pages) * 100
				: null);
		const progress =
			rawPct != null
				? `${Math.round(rawPct)}%`
				: read?.progress_pages
					? `p${read.progress_pages}`
					: "reading";

		return {
			id: row.id,
			title: row.book?.title ?? "",
			image: bookImage(row.book),
			url: bookUrl(row.book),
			progress,
			date: new Date(row.last_read_date ?? row.date_added ?? 0),
		};
	});
}

// All read books — callers split into reviewed (have review_raw) vs finished-
// only. Books without a review still carry their rating, if any.
export async function getHardcoverRead(): Promise<HardcoverReview[]> {
	const data = await hardcoverRequest(`
    query {
      me {
        user_books(
          where: { status_id: { _eq: 3 } }
          order_by: { reviewed_at: desc_nulls_last }
          limit: 500
        ) {
          id
          rating
          review_raw
          review_has_spoilers
          reviewed_at
          last_read_date
          book { id title slug image { url } cached_image }
        }
      }
    }
  `);

	const rows = data?.me?.[0]?.user_books ?? [];
	// biome-ignore lint/suspicious/noExplicitAny: hardcover row is loosely typed
	return rows.map((row: any): HardcoverReview => {
		const note = row.review_raw?.trim() ?? "";
		return {
			id: row.id,
			title: row.book?.title ?? "",
			image: bookImage(row.book),
			url: bookUrl(row.book),
			rating: row.rating ? `${row.rating}/5` : "",
			note,
			spoiler: Boolean(row.review_has_spoilers),
			hasReview: Boolean(note),
			date: new Date(row.reviewed_at ?? row.last_read_date ?? 0),
		};
	});
}
