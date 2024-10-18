/** @type {import('next').NextConfig} */
const nextConfig = {
    images: {
      domains: ['oaidalleapiprodscus.blob.core.windows.net', "localhost"], // 許可したい画像ドメインをリストに追加
    },
};

export default nextConfig;
