import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Calculator,
  Search,
  Plus,
  Filter,
  Eye,
  Edit,
  ChefHat,
  Clock,
  Users,
  Utensils,
  DollarSign,
  TrendingUp,
} from "lucide-react"

export function SimpleRecipes() {
  const recipes = [
    {
      id: "RCP-001",
      name: "Kue Lapis Legit",
      category: "Kue Tradisional",
      difficulty: "Hard",
      prep_time: 180,
      cook_time: 120,
      servings: 8,
      cost_per_serving: 18750,
      selling_price: 35000,
      profit_margin: 46,
      ingredients: [
        { name: "Telur", qty: 20, unit: "butir", cost: 50000 },
        { name: "Mentega", qty: 500, unit: "gr", cost: 45000 },
        { name: "Tepung Terigu", qty: 300, unit: "gr", cost: 9000 },
        { name: "Gula Halus", qty: 400, unit: "gr", cost: 12000 },
        { name: "Santan", qty: 200, unit: "ml", cost: 8000 },
        { name: "Rempah-rempah", qty: 1, unit: "set", cost: 25000 }
      ],
      total_cost: 150000,
      popularity: "high"
    },
    {
      id: "RCP-002", 
      name: "Brownies Coklat",
      category: "Dessert Modern",
      difficulty: "Medium",
      prep_time: 30,
      cook_time: 45,
      servings: 12,
      cost_per_serving: 8333,
      selling_price: 15000,
      profit_margin: 44,
      ingredients: [
        { name: "Dark Chocolate", qty: 200, unit: "gr", cost: 35000 },
        { name: "Mentega", qty: 150, unit: "gr", cost: 13500 },
        { name: "Telur", qty: 3, unit: "butir", cost: 7500 },
        { name: "Tepung Terigu", qty: 100, unit: "gr", cost: 3000 },
        { name: "Gula Pasir", qty: 150, unit: "gr", cost: 4500 },
        { name: "Kakao Powder", qty: 30, unit: "gr", cost: 6500 }
      ],
      total_cost: 100000,
      popularity: "high"
    },
    {
      id: "RCP-003",
      name: "Cupcakes Vanilla",
      category: "Cupcakes",
      difficulty: "Easy",
      prep_time: 20,
      cook_time: 25,
      servings: 24,
      cost_per_serving: 2500,
      selling_price: 5000,
      profit_margin: 50,
      ingredients: [
        { name: "Tepung Terigu", qty: 250, unit: "gr", cost: 7500 },
        { name: "Gula Pasir", qty: 200, unit: "gr", cost: 6000 },
        { name: "Mentega", qty: 100, unit: "gr", cost: 9000 },
        { name: "Telur", qty: 2, unit: "butir", cost: 5000 },
        { name: "Susu", qty: 150, unit: "ml", cost: 6000 },
        { name: "Vanilla Extract", qty: 1, unit: "tsp", cost: 2500 },
        { name: "Baking Powder", qty: 2, unit: "tsp", cost: 1000 }
      ],
      total_cost: 60000,
      popularity: "medium"
    },
    {
      id: "RCP-004",
      name: "Roti Tawar",
      category: "Roti",
      difficulty: "Medium",
      prep_time: 45,
      cook_time: 35,
      servings: 16,
      cost_per_serving: 3125,
      selling_price: 6000,
      profit_margin: 48,
      ingredients: [
        { name: "Tepung Terigu", qty: 500, unit: "gr", cost: 15000 },
        { name: "Ragi Instant", qty: 7, unit: "gr", cost: 3500 },
        { name: "Gula Pasir", qty: 50, unit: "gr", cost: 1500 },
        { name: "Garam", qty: 8, unit: "gr", cost: 500 },
        { name: "Mentega", qty: 50, unit: "gr", cost: 4500 },
        { name: "Susu", qty: 200, unit: "ml", cost: 8000 },
        { name: "Air", qty: 150, unit: "ml", cost: 0 }
      ],
      total_cost: 50000,
      popularity: "high"
    }
  ]

  const getDifficultyBadge = (difficulty: string) => {
    const difficultyConfig = {
      Easy: { className: "bg-green-100 text-green-800" },
      Medium: { className: "bg-yellow-100 text-yellow-800" },
      Hard: { className: "bg-red-100 text-red-800" }
    }
    
    const config = difficultyConfig[difficulty as keyof typeof difficultyConfig] || difficultyConfig.Easy
    
    return (
      <Badge variant="outline" className={config.className}>
        {difficulty}
      </Badge>
    )
  }

  const getPopularityBadge = (popularity: string) => {
    const popularityConfig = {
      high: { label: "Popular", className: "bg-blue-100 text-blue-800" },
      medium: { label: "Moderate", className: "bg-gray-100 text-gray-800" },
      low: { label: "Low", className: "bg-orange-100 text-orange-800" }
    }
    
    const config = popularityConfig[popularity as keyof typeof popularityConfig] || popularityConfig.medium
    
    return (
      <Badge variant="outline" className={config.className}>
        {config.label}
      </Badge>
    )
  }

  const formatRupiah = (amount: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
    }).format(amount)
  }

  const formatTime = (minutes: number) => {
    if (minutes < 60) {
      return `${minutes} min`
    }
    const hours = Math.floor(minutes / 60)
    const mins = minutes % 60
    return `${hours}h ${mins > 0 ? mins + 'm' : ''}`
  }

  // Statistics
  const totalRecipes = recipes.length
  const avgProfitMargin = recipes.reduce((sum, recipe) => sum + recipe.profit_margin, 0) / totalRecipes
  const popularRecipes = recipes.filter(r => r.popularity === 'high').length
  const avgCostPerServing = recipes.reduce((sum, recipe) => sum + recipe.cost_per_serving, 0) / totalRecipes

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Recipes</h1>
          <p className="text-muted-foreground">
            Manage recipes, calculate costs, and optimize profit margins
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline">
            <Filter className="h-4 w-4 mr-2" />
            Filter
          </Button>
          <Button variant="outline">
            <Calculator className="h-4 w-4 mr-2" />
            Calculate Costs
          </Button>
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            New Recipe
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Recipes</CardTitle>
            <ChefHat className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalRecipes}</div>
            <p className="text-xs text-muted-foreground">Active recipes</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Profit Margin</CardTitle>
            <TrendingUp className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{avgProfitMargin.toFixed(1)}%</div>
            <p className="text-xs text-muted-foreground">Across all recipes</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Popular Recipes</CardTitle>
            <Utensils className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{popularRecipes}</div>
            <p className="text-xs text-muted-foreground">High demand items</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Cost/Serving</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatRupiah(avgCostPerServing)}</div>
            <p className="text-xs text-muted-foreground">Production cost average</p>
          </CardContent>
        </Card>
      </div>

      {/* Recipes Table */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Recipe Collection</CardTitle>
              <CardDescription>Manage recipes with cost analysis and profitability</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4 mb-6">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search recipes..."
                className="pl-10"
              />
            </div>
          </div>

          {/* Table */}
          <div className="border rounded-lg">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Recipe</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Difficulty</TableHead>
                  <TableHead>Time</TableHead>
                  <TableHead>Servings</TableHead>
                  <TableHead>Cost/Serving</TableHead>
                  <TableHead>Selling Price</TableHead>
                  <TableHead>Profit</TableHead>
                  <TableHead>Popularity</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {recipes.map((recipe) => (
                  <TableRow key={recipe.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-lg bg-muted flex items-center justify-center">
                          <ChefHat className="h-5 w-5 text-muted-foreground" />
                        </div>
                        <div>
                          <div className="font-medium">{recipe.name}</div>
                          <div className="text-sm text-muted-foreground">{recipe.id}</div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{recipe.category}</Badge>
                    </TableCell>
                    <TableCell>
                      {getDifficultyBadge(recipe.difficulty)}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1 text-sm">
                        <Clock className="h-3 w-3 text-muted-foreground" />
                        <div>
                          <div className="font-medium">
                            {formatTime(recipe.prep_time + recipe.cook_time)}
                          </div>
                          <div className="text-muted-foreground text-xs">
                            Prep: {formatTime(recipe.prep_time)}
                          </div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Users className="h-3 w-3 text-muted-foreground" />
                        {recipe.servings}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="font-medium">{formatRupiah(recipe.cost_per_serving)}</div>
                    </TableCell>
                    <TableCell>
                      <div className="font-medium">{formatRupiah(recipe.selling_price)}</div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        <div className="font-medium text-green-600">
                          {recipe.profit_margin}%
                        </div>
                        <div className="text-muted-foreground">
                          {formatRupiah(recipe.selling_price - recipe.cost_per_serving)}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      {getPopularityBadge(recipe.popularity)}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Button variant="ghost" size="sm">
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="sm">
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="sm">
                          <Calculator className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}