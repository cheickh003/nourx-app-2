"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __exportStar = (this && this.__exportStar) || function(m, exports) {
    for (var p in m) if (p !== "default" && !Object.prototype.hasOwnProperty.call(exports, p)) __createBinding(exports, m, p);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.z = void 0;
// Export des schémas d'authentification
__exportStar(require("./schemas/auth"), exports);
// Export des schémas d'organisation
__exportStar(require("./schemas/organization"), exports);
// Export des schémas d'utilisateurs
__exportStar(require("./schemas/user"), exports);
// Export des schémas de projets
__exportStar(require("./schemas/project"), exports);
// Export des schémas de tickets
__exportStar(require("./schemas/ticket"), exports);
// Export des utilitaires de validation
__exportStar(require("./utils/validation"), exports);
// Re-export de Zod pour faciliter l'utilisation
var zod_1 = require("zod");
Object.defineProperty(exports, "z", { enumerable: true, get: function () { return zod_1.z; } });
//# sourceMappingURL=index.js.map