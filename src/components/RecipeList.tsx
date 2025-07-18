
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Edit, Trash2, ChefHat, Users, DollarSign } from "lucide-react";
import { Recipe } from "@/types/recipe";

interface RecipeListProps {
  recipes: Recipe[];
  onEdit: (recipe: Recipe) => void;
  onDelete: (id: string) => void;
}

const RecipeList = ({ recipes, onEdit, onDelete }: RecipeListProps) => {
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(value);
  };

  const formatDate = (date: Date) => {
  // Periksa apakah objek Date valid sebelum memformat
  if (date instanceof Date && !isNaN(date.getTime())) {
    return new Intl.DateTimeFormat('id-ID', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(date);
  }
  return 'Tanggal tidak valid'; // Fallback jika tanggal tidak valid
};

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-6">
      {recipes.map((recipe) => (
        <Card
          key={recipe.id}
          className="shadow-lg border-0 bg-white/80 backdrop-blur-sm hover:shadow-xl transition-all duration-300"
        >
          <CardHeader className="bg-gradient-to-r from-orange-500 to-red-500 text-white rounded-t-lg p-4">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <CardTitle className="text-lg font-semibold mb-2 line-clamp-2">
                  {recipe.namaResep}
                </CardTitle>
                <div className="flex items-center text-orange-100 text-sm">
                  <Users className="h-4 w-4 mr-1" />
                  <span>{recipe.porsi} porsi</span>
                </div>
              </div>
              <ChefHat className="h-6 w-6 text-orange-100 flex-shrink-0 ml-2" />
            </div>
          </CardHeader>

          <CardContent className="p-4 space-y-4">
            {/* Description */}
            {recipe.deskripsi && (
              <p className="text-sm text-gray-600 line-clamp-2">
                {recipe.deskripsi}
              </p>
            )}

            {/* Ingredients Count */}
            <div className="text-sm text-gray-500">
              {recipe.ingredients.length} bahan
            </div>

            {/* Financial Info */}
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Total HPP:</span>
                <span className="font-medium text-blue-600">
                  {formatCurrency(recipe.totalHPP)}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">HPP per Porsi:</span>
                <span className="font-medium">
                  {formatCurrency(recipe.hppPerPorsi)}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Harga Jual per Porsi:</span>
                <span className="font-semibold text-green-600">
                  {formatCurrency(recipe.hargaJualPerPorsi)}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Margin:</span>
                <span className="font-medium">{recipe.marginKeuntungan}%</span>
              </div>
            </div>

            {/* Profit per portion */}
            <div className="bg-green-50 p-3 rounded-lg">
              <div className="flex items-center justify-between">
                <span className="text-sm text-green-700 font-medium">
                  Keuntungan per Porsi:
                </span>
                <div className="flex items-center text-green-600 font-semibold">
                  <DollarSign className="h-4 w-4 mr-1" />
                  {formatCurrency(recipe.hargaJualPerPorsi - recipe.hppPerPorsi)}
                </div>
              </div>
            </div>

            {/* Timestamps */}
            <div className="text-xs text-gray-400 border-t pt-3">
              <div>Dibuat: {formatDate(recipe.createdAt)}</div>
              {recipe.updatedAt.getTime() !== recipe.createdAt.getTime() && (
                <div>Diupdate: {formatDate(recipe.updatedAt)}</div>
              )}
            </div>

            {/* Actions */}
            <div className="flex gap-2 pt-3">
              <Button
                variant="outline"
                size="sm"
                onClick={() => onEdit(recipe)}
                className="flex-1 hover:bg-blue-50 hover:text-blue-600 hover:border-blue-300"
              >
                <Edit className="h-4 w-4 mr-2" />
                Edit
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => onDelete(recipe.id)}
                className="flex-1 hover:bg-red-50 hover:text-red-600 hover:border-red-300"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Hapus
              </Button>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

export default RecipeList;
