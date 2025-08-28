"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PricingService = void 0;
const common_1 = require("@nestjs/common");
let PricingService = class PricingService {
    calculatePrice(data) {
        console.log('[Pricing Service] Calculating price for:', data);
        const basePrice = Math.floor(Math.random() * 1000) + 500;
        const sellingFactor = 1.25;
        const finalPrice = basePrice * sellingFactor;
        return {
            success: true,
            message: 'Price calculated successfully.',
            calculation: {
                basePrice: basePrice.toFixed(2),
                sellingFactor: sellingFactor,
                finalPrice: finalPrice.toFixed(2),
                currency: 'THB',
            },
        };
    }
};
exports.PricingService = PricingService;
exports.PricingService = PricingService = __decorate([
    (0, common_1.Injectable)()
], PricingService);
//# sourceMappingURL=pricing.service.js.map