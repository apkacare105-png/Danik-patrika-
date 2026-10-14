export type Role = 'super_admin' | 'admin' | 'author' | 'public_visitor';
export type ArticleStatus = 'draft' | 'pending' | 'published' | 'rejected';
export type AdSlotType = 'header' | 'sidebar_sticky' | 'in_article' | 'footer';

export const ROLE_LABEL: Record<Role, string> = {
  super_admin: 'सुपर एडमिन',
  admin: 'एडमिन',
  author: 'लेखक',
  public_visitor: 'पाठक',
};

export const STATUS_LABEL: Record<ArticleStatus, string> = {
  draft: 'ड्राफ़्ट',
  pending: 'समीक्षा में',
  published: 'प्रकाशित',
  rejected: 'अस्वीकृत',
};

export const AD_SLOT_LABEL: Record<AdSlotType, string> = {
  header: 'हेडर बैनर',
  sidebar_sticky: 'साइडबार (स्टिकी)',
  in_article: 'लेख के भीतर',
  footer: 'फ़ुटर बैनर',
};

export type SubCategory = {
  id: string;
  category_id: string;
  name_hi: string;
  slug: string;
  order_index: number;
  is_active: boolean;
};

export type Category = {
  id: string;
  name_hi: string;
  slug: string;
  order_index: number;
  is_active: boolean;
  sub_categories: SubCategory[];
};

export type Block = { type: 'p' | 'h2' | 'quote' | 'ul'; text?: string; items?: string[] };
export type RichContent = { type: 'doc'; blocks: Block[]; md?: string };

export type Article = {
  id: string;
  title_hi: string;
  slug: string;
  content_hi: RichContent;
  excerpt_hi: string;
  featured_image: string | null;
  status: ArticleStatus;
  author_id: string | null;
  author_name: string;
  category_id: string | null;
  category_slug: string;
  category_name: string;
  sub_category_id: string | null;
  views: number;
  published_at: string;
  rejection_note?: string | null;
  is_blog?: boolean;
};

export type ArticleCardData = Pick<
  Article,
  'id' | 'title_hi' | 'slug' | 'category_slug' | 'category_name' | 'featured_image' | 'excerpt_hi' | 'published_at'
>;

export type AdSlot = {
  id: string;
  slot_key: string;
  slot_type: AdSlotType;
  ad_code: string;
  is_enabled: boolean;
  publisher_id: string | null;
};

export type PortfolioProject = {
  id: string;
  client_name: string;
  project_type: string;
  thumbnail_url: string | null;
  live_url: string | null;
  description_hi: string;
  case_study_markdown: string;
  order_index?: number;
};

export type NavLink = { label: string; href: string };

export type SiteSettings = {
  site_name: string;
  logo_url: string | null;
  favicon_url: string | null;
  theme: { accent: string; ink: string };
  seo: { title: string; description: string; keywords: string; og_image: string };
  header_nav: NavLink[];
  footer_nav: NavLink[];
  static_pages: { slug: string; title: string; body: string }[];
};

export type Profile = {
  id: string;
  display_name: string;
  email: string;
  role: Role;
  bio?: string | null;
  avatar_url?: string | null;
  created_at: string;
};

export type Story = {
  id: string;
  title: string;
  cover: string;
  slides: { image: string; text: string }[];
};

export type ActionResult = { ok: boolean; message: string; id?: string };

export type ArticleInput = {
  id?: string;
  title_hi: string;
  excerpt_hi: string;
  content_md: string;
  featured_image: string | null;
  category_id: string;
  sub_category_id: string | null;
  is_blog?: boolean;
};
