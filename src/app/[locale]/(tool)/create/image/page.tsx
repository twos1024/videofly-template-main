import { Metadata } from "next";
import { FreeImageGenerator } from "@/components/template/free-image-generator";

export const metadata: Metadata = {
  title: "AI 图片生成 - PixelMuse",
  description: "自由输入描述，AI 生成精美图片",
};

export default function FreeImagePage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">AI 图片生成</h1>
        <p className="mt-2 text-muted-foreground">输入你想要的画面描述，AI 帮你生成</p>
      </div>
      <FreeImageGenerator />
    </div>
  );
}
