function composite(bgImg, fgImg, fgOpac, fgPos) {
    const { data: bgData, width: bgWidth, height: bgHeight } = bgImg;
    const { data: fgData, width: fgWidth, height: fgHeight } = fgImg;

    for (let y = 0; y < fgHeight; y++) {
        for (let x = 0; x < fgWidth; x++) {
            const 
                fgIndex = (y * fgWidth + x) * 4,
                bgX = x + fgPos.x, 
                bgY = y + fgPos.y;

            if (bgX < 0 || bgX >= bgWidth || bgY < 0 || bgY >= bgHeight) continue; // pixel outside

            const 
                bgIndex = (bgY * bgWidth + bgX) * 4,
                fgA = (fgData[fgIndex + 3] / 255) * fgOpac, 
                bgA = bgData[bgIndex + 3] / 255,
                outA = fgA + bgA * (1 - fgA);
                
            if (!outA) continue;
 
            for (let i = 0; i < 3; i++) // for each channel apply alfa blending
                bgData[bgIndex + i] = (fgData[fgIndex + i] * fgA + bgData[bgIndex + i] * bgA * (1 - fgA)) / outA;
            bgData[bgIndex + 3] = outA * 255;
        }
    }
}
