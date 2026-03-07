/**
 * ============================================
 * R2 存储桶连通性测试脚本 (ESM 版本)
 * ============================================
 *
 * 使用方法:
 * node scripts/test-storage.mjs
 *
 * 会自动加载 .env.local 文件中的环境变量
 */

import dotenv from "dotenv";
import { s3mini } from "s3mini";
import { resolve } from "node:path";

// 加载环境变量
const envPath = resolve(process.cwd(), ".env.local");
dotenv.config({ path: envPath });

const PLACEHOLDER_HINT =
  "请把 .env.local 里的 STORAGE_* 示例值替换成真实的 R2/S3 配置。";

function looksLikePlaceholder(value) {
  const normalized = value.trim().toLowerCase();

  return (
    normalized.includes("<") ||
    normalized.includes(">") ||
    normalized.includes("replace_with") ||
    normalized.includes("your-domain") ||
    normalized.includes("your-bucket") ||
    normalized.includes("xxxxxxxx")
  );
}

function validateUrlConfig(value, envName) {
  if (!value?.trim()) {
    throw new Error(`${envName} 未配置`);
  }

  if (looksLikePlaceholder(value)) {
    throw new Error(`${envName} 仍然是示例占位值。${PLACEHOLDER_HINT}`);
  }

  const candidate = /^(https?:)?\/\//i.test(value) ? value : `https://${value}`;

  try {
    new URL(candidate);
  } catch {
    throw new Error(`${envName} 不是合法 URL: ${value}`);
  }

  return value.replace(/\/$/, "");
}

function validateBucket(value) {
  const bucket = value?.trim();
  if (!bucket) {
    throw new Error("STORAGE_BUCKET 未配置");
  }
  if (looksLikePlaceholder(bucket)) {
    throw new Error(`STORAGE_BUCKET 仍然是示例占位值。${PLACEHOLDER_HINT}`);
  }
  if (!/^[a-z0-9][a-z0-9.-]{1,61}[a-z0-9]$/.test(bucket)) {
    throw new Error("STORAGE_BUCKET 不是合法的 S3/R2 bucket 名称");
  }
  return bucket;
}

async function testStorageConnection() {
  console.log("🔍 开始测试 R2 存储桶连接...\n");

  try {
    // 读取环境变量
    const rawEndpoint = process.env.STORAGE_ENDPOINT;
    const accessKeyId = process.env.STORAGE_ACCESS_KEY;
    const secretAccessKey = process.env.STORAGE_SECRET_KEY;
    const rawBucket = process.env.STORAGE_BUCKET;
    const rawPublicDomain = process.env.STORAGE_DOMAIN;

    // 验证配置
    console.log("1️⃣ 验证存储配置...");
    if (!rawEndpoint || !accessKeyId || !secretAccessKey || !rawBucket) {
      console.error("   ❌ 缺少必需的环境变量\n");
      console.log("💡 请确保 .env.local 文件中配置了以下变量:");
      console.log("   - STORAGE_ENDPOINT");
      console.log("   - STORAGE_ACCESS_KEY");
      console.log("   - STORAGE_SECRET_KEY");
      console.log("   - STORAGE_BUCKET");
      console.log("   - STORAGE_DOMAIN (可选)\n");

      // 显示当前已配置的变量（隐藏敏感信息）
      console.log("📋 当前配置:");
      console.log(`   STORAGE_ENDPOINT: ${rawEndpoint ? "✅ 已配置" : "❌ 未配置"}`);
      console.log(`   STORAGE_ACCESS_KEY: ${accessKeyId ? "✅ 已配置" : "❌ 未配置"}`);
      console.log(`   STORAGE_SECRET_KEY: ${secretAccessKey ? "✅ 已配置" : "❌ 未配置"}`);
      console.log(`   STORAGE_BUCKET: ${rawBucket ? "✅ 已配置" : "❌ 未配置"}`);
      console.log(`   STORAGE_DOMAIN: ${rawPublicDomain ? "✅ 已配置" : "⚪ 未设置"}`);

      process.exit(1);
    }

    const endpoint = validateUrlConfig(rawEndpoint, "STORAGE_ENDPOINT");
    const bucket = validateBucket(rawBucket);
    const publicDomain = rawPublicDomain
      ? validateUrlConfig(rawPublicDomain, "STORAGE_DOMAIN")
      : undefined;

    console.log("   ✅ 环境变量配置完整");
    console.log(`   📍 Endpoint: ${endpoint}`);
    console.log(`   🪣 Bucket: ${bucket}`);
    console.log(`   🌐 Public Domain: ${publicDomain || "未设置"}\n`);

    // 创建 S3 客户端
    console.log("2️⃣ 初始化 S3 客户端...");
    const endpointWithBucket = `${endpoint}/${bucket}`;
    const client = new s3mini({
      endpoint: endpointWithBucket,
      region: process.env.STORAGE_REGION || "auto",
      accessKeyId,
      secretAccessKey,
    });
    console.log("   ✅ S3 客户端初始化成功\n");

    // 测试上传
    console.log("3️⃣ 测试上传文件...");
    const testKey = `test/test-${Date.now()}.txt`;
    const testContent = Buffer.from("Hello from R2 storage test! " + new Date().toISOString());

    const uploadResponse = await client.putObject(
      testKey,
      testContent,
      "text/plain"
    );

    if (!uploadResponse.ok) {
      throw new Error(`上传失败: ${uploadResponse.statusText}`);
    }

    console.log("   ✅ 文件上传成功!");
    console.log(`   📁 Key: ${testKey}\n`);

    // 构建公开 URL
    const publicUrl = publicDomain
      ? `${publicDomain}/${testKey}`
      : `${endpointWithBucket}/${testKey}`;

    console.log("4️⃣ 测试公开访问...");
    console.log(`   🔗 URL: ${publicUrl}`);

    try {
      const response = await fetch(publicUrl);
      if (response.ok) {
        const content = await response.text();
        console.log(`   ✅ 公开访问成功!`);
        console.log(`   📄 内容: ${content}\n`);
      } else {
        console.log(`   ⚠️  公开访问失败: ${response.status} ${response.statusText}`);
        console.log(`   💡 提示: 检查 STORAGE_DOMAIN 或存储桶公开访问设置\n`);
      }
    } catch (error) {
      console.log(`   ⚠️  公开访问失败: ${error.message}`);
      console.log(`   💡 提示: 检查 STORAGE_DOMAIN 或存储桶公开访问设置\n`);
    }

    console.log("✅ 所有测试完成!");
    console.log("\n📋 测试总结:");
    console.log("   - 存储桶配置: ✅ 正常");
    console.log("   - S3 客户端: ✅ 正常");
    console.log("   - 文件上传: ✅ 正常");
    console.log("   - 公开访问: 请查看上方结果");

  } catch (error) {
    console.error("\n❌ 测试失败!");
    console.error(`错误信息: ${error.message}`);

    if (error.message.includes("fetch failed") || error.message.includes("ECONNREFUSED")) {
      console.log("\n💡 可能的原因:");
      console.log("   - Endpoint 地址不正确");
      console.log("   - 网络连接问题");
      console.log("   - R2 服务暂时不可用");
    }
  }
}

// 运行测试
testStorageConnection();
