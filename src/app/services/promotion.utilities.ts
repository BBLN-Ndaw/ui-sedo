import { Injectable } from "@angular/core";
import { ProductWithCategoryDto } from "../shared/models";
import { FormatUtilities } from "./format.utilities";

@Injectable({
  providedIn: 'root'
})
export class PromotionUtilities {

  constructor(private formatUtilities: FormatUtilities) {}

  /**
   * Vérifie si un produit est actuellement en promotion valide
   */
  isValidPromotion(product: ProductWithCategoryDto): boolean {
    return product.isOnPromotion && 
           product.promotionPrice != null && 
           product.promotionPrice > 0 &&
           product.promotionPrice < product.sellingPrice &&
           (!product.promotionEndDate || new Date(product.promotionEndDate) > new Date());
  }

  /**
   * Calcule le prix TTC à partir du prix HT et du taux de TVA
   */
  calculatePriceTTC(priceHT: number, taxRate: number): number {
    return priceHT * (1 + taxRate);
  }

  /**
   * Obtient le prix TTC promotionnel d'un produit
   */
  getPromotionalPriceTTC(product: ProductWithCategoryDto): string {
    const promotionPriceHT = product.promotionPrice || product.sellingPrice;
    const priceTTC = this.calculatePriceTTC(promotionPriceHT, product.taxRate);
    return this.formatUtilities.formatCurrency(priceTTC);
  }

  /**
   * Obtient le prix TTC normal d'un produit (pour affichage barré dans les promotions)
   */
  getNormalPriceTTC(product: ProductWithCategoryDto): string {
    const priceTTC = this.calculatePriceTTC(product.sellingPrice, product.taxRate);
    return this.formatUtilities.formatCurrency(priceTTC);
  }

  /**
   * Calcule le prix TTC applicable (promotionnel ou normal)
   */
  getApplicablePriceTTC(product: ProductWithCategoryDto): number {
    const priceHT = this.getApplicablePriceHT(product);
    return this.calculatePriceTTC(priceHT, product.taxRate);
  }

  /**
   * Obtient le prix HT applicable (promotionnel ou normal)
   */
  getApplicablePriceHT(product: ProductWithCategoryDto): number {
    return this.isValidPromotion(product) && product.promotionPrice
      ? product.promotionPrice
      : product.sellingPrice;
  }

  /**
   * Formate le prix TTC applicable d'un produit
   */
  formatApplicablePriceTTC(product: ProductWithCategoryDto): string {
    const priceTTC = this.getApplicablePriceTTC(product);
    return this.formatUtilities.formatCurrency(priceTTC);
  }

  /**
   * Calcule le pourcentage de réduction
   */
  getDiscountPercentage(product: ProductWithCategoryDto): number {
    if (!this.isValidPromotion(product) || !product.promotionPrice) return 0;
    return Math.round((1 - product.promotionPrice / product.sellingPrice) * 100);
  }

  /**
   * Calcule le montant d'économies en TTC
   */
  getSavingsAmountTTC(product: ProductWithCategoryDto): string {
    if (!this.isValidPromotion(product) || !product.promotionPrice) return '';
    const normalPriceTTC = this.calculatePriceTTC(product.sellingPrice, product.taxRate);
    const promoPriceTTC = this.calculatePriceTTC(product.promotionPrice, product.taxRate);
    const savings = normalPriceTTC - promoPriceTTC;
    return this.formatUtilities.formatCurrency(savings);
  }

  /**
   * Vérifie si une promotion expire bientôt (dans les 3 jours)
   */
  isPromotionExpiringSoon(product: ProductWithCategoryDto): boolean {
    if (!this.isValidPromotion(product) || !product.promotionEndDate) return false;
    const now = new Date();
    const endDate = new Date(product.promotionEndDate);
    const diffTime = endDate.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays <= 3 && diffDays > 0;
  }

  /**
   * Formate un nombre en devise EUR
   */
  formatCurrency(price: number): string {
    return this.formatUtilities.formatCurrency(price);
  }

}