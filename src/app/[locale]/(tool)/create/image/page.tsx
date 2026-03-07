import { FreeImageGenerator } from "@/components/template/free-image-generator";
import { notFound } from "next/navigation";
import { enableImageGeneration } from "@/config/features";

export default function FreeImagePage() {
  if (!enableImageGeneration) {
    notFound();
  }

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
