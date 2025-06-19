"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createDevotional = void 0;
const devotional_model_1 = require("../models/devotional.model");
const createDevotional = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const userId = req.userId;
        const { title, content, scriptureReference, author, tags } = req.body;
        if (!title || !content) {
            res.status(400).json({
                success: false,
                message: "Title and content are required",
            });
            return;
        }
        const devotional = new devotional_model_1.Devotional({
            title,
            content,
            scriptureReference,
            author,
            tags,
            submittedBy: userId,
        });
        yield devotional.save();
        res.status(201).json({
            success: true,
            message: "Devotional submitted successfully",
            devotional,
        });
    }
    catch (error) {
        console.error("Create devotional error:", error);
        res.status(500).json({
            success: false,
            message: "Failed to create devotional",
        });
    }
});
exports.createDevotional = createDevotional;
