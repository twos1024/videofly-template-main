export interface VideoModelCatalogItem {
  id: string;
  name: string;
  officialName: string;
  vendor: string;
  icon: string;
  color: string;
  description: string;
  docsUrl: string;
}

export const VIDEO_MODEL_CATALOG: Record<string, VideoModelCatalogItem> = {
  "sora-2": {
    id: "sora-2",
    name: "Sora 2",
    officialName: "Sora 2",
    vendor: "EvoLink",
    icon: "https://videocdn.pollo.ai/web-cdn/pollo/test/cm3pol28q0000ojuuyeo77e36/image/1759998830447-10c6484e-786d-4d05-a2c4-f0c929b1042b.svg",
    color: "#0f0f10",
    description: "Cinematic text and image to video generation with clean prompt adherence.",
    docsUrl: "https://evolink.ai/zh/sora-2",
  },
  "wan2.6": {
    id: "wan2.6",
    name: "Wan 2.6",
    officialName: "Wan 2.6",
    vendor: "EvoLink",
    icon: "https://videocdn.pollo.ai/model-icon/svg/Group.svg",
    color: "#ff6a00",
    description: "Flexible text, image and reference workflows with 720P and 1080P output.",
    docsUrl: "https://evolink.ai/zh/wan-2-6",
  },
  "veo-3.1": {
    id: "veo-3.1",
    name: "Veo 3.1 Fast Lite",
    officialName: "Veo 3.1 Fast Lite",
    vendor: "EvoLink",
    icon: "https://videocdn.pollo.ai/web-cdn/pollo/production/cm3po9yyf0003oh0c2iyt8ajy/image/1753259785486-de7c53b0-9576-4d3e-a76a-a94fcac57bf1.svg",
    color: "#4285f4",
    description: "Fast prompt and first-last frame video generation tuned for short-form speed.",
    docsUrl: "https://evolink.ai/zh/veo-3-1",
  },
  "seedance-1.5-pro": {
    id: "seedance-1.5-pro",
    name: "Seedance 1.5 Pro",
    officialName: "Seedance 1.5 Pro",
    vendor: "EvoLink",
    icon: "https://videocdn.pollo.ai/web-cdn/pollo/production/cm3po9yyf0003oh0c2iyt8ajy/image/1754894158793-1e7ef687-c3c1-4f44-8b06-d044a8121f66.svg",
    color: "#10b981",
    description: "Wide aspect ratio coverage with multi-shot motion and optional audio generation.",
    docsUrl: "https://evolink.ai/zh/seedance-1-5-pro",
  },
};

export function getVideoModelCatalogItem(modelId: string) {
  return VIDEO_MODEL_CATALOG[modelId];
}
