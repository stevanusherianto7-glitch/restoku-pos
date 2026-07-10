import { QRCodeSVG } from 'qrcode.react';

interface QRDisplayProps {
    content: string;
    size?: number;
    includeLogo?: boolean;
}

export function QRDisplay({ content, size = 200, includeLogo = false }: QRDisplayProps) {
    return (
        <div className="bg-white p-2 rounded-lg inline-block shadow-sm">
            <QRCodeSVG
                value={content}
                size={size}
                level="M"
                includeMargin={false}
                imageSettings={
                    includeLogo
                        ? {
                              src: '/vite.svg', // Using a placeholder logo for Restoku
                              height: size * 0.25,
                              width: size * 0.25,
                              excavate: true,
                          }
                        : undefined
                }
            />
        </div>
    );
}
