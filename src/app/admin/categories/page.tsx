import { getAllCategories } from '@/lib/admin-data';
import { CategoryManager } from '@/components/admin/category-manager';

export default async function CategoriesPage() {
  return <CategoryManager initial={await getAllCategories()} />;
}
