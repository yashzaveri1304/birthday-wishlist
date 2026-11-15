/** What guests receive. Deliberately has NO claimer name or token. */
export type PublicItem = {
  id: string;
  name: string;
  image_url: string | null;
  price: string | null;
  link: string | null;
  position: number;
  is_claimed: boolean;
};

/** What the admin receives. Claim fields only arrive when "Reveal claims" is on. */
export type AdminItem = Omit<PublicItem, "is_claimed"> & {
  is_claimed?: boolean;
  claimed_by_name?: string | null;
  claimed_at?: string | null;
};

export const PUBLIC_COLUMNS =
  "id, name, image_url, price, link, position, is_claimed";
export const ADMIN_COLUMNS = "id, name, image_url, price, link, position";
export const ADMIN_REVEAL_COLUMNS = `${ADMIN_COLUMNS}, is_claimed, claimed_by_name, claimed_at`;
