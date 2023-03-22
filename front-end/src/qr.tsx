import jsQR from 'jsqr'
import { Point } from 'jsqr/dist/locator'
import React, { useEffect, useRef, useState } from 'react'

type QRReaderProps = {
    outputHandler: (s: string) => void
    successMsg?: string
}

export function QRReader(props: QRReaderProps) {
    const canvasRef = useRef<HTMLCanvasElement>()
    const videoRef = useRef<HTMLVideoElement>()

    useEffect(() => {
        videoRef.current = document.createElement("video");

        // Use facingMode: environment to attemt to get the front camera on phones
        navigator.mediaDevices
            .getUserMedia({
                video: { facingMode: "environment" }
            })
            .then(stream => {
                videoRef.current.srcObject = stream;
                videoRef.current.setAttribute("playsinline", "true"); // required for iOS Safari
                videoRef.current.play();
                setLoadingMessage("⌛")
                requestAnimationFrame(tick);
            });
    }, [])

    const [statusMessage, setLoadingMessage] = useState("📷 Permission Required")
    const [isCameraFeedReady, setIsCameraFeedReady] = useState(false)

    return (
        <div className='qrReader rounded-1'>
            <div hidden={!props.successMsg}
                className='size-to-parent fadeIn absolute-tl flex-centre flex-dir-col gap-1'
                style={{ background: '#fff' }}>
                <span style={{ fontSize: '3rem' }}>✅</span>
                <span style={{ fontSize: '2rem' }}>{props.successMsg}</span>
            </div>
            <div hidden={isCameraFeedReady}>{statusMessage}</div>
            <canvas className='size-to-parent' ref={canvasRef} hidden={!isCameraFeedReady}></canvas>
        </div>
    )

    function drawLine(startPt: Point, endPt: Point, colour: string) {
        const canvas = canvasRef.current.getContext("2d");
        canvas.beginPath();
        canvas.moveTo(startPt.x, startPt.y);
        canvas.lineTo(endPt.x, endPt.y);
        canvas.lineWidth = 4;
        canvas.strokeStyle = colour;
        canvas.stroke();
    }

    function tick() {
        if (videoRef.current.readyState === videoRef.current.HAVE_ENOUGH_DATA && canvasRef.current) {
            const canvas = canvasRef.current.getContext("2d");

            setIsCameraFeedReady(true)
            setLoadingMessage(null)

            canvasRef.current.height = videoRef.current.videoHeight;
            canvasRef.current.width = videoRef.current.videoWidth;
            canvas.drawImage(videoRef.current, 0, 0, canvasRef.current.width, canvasRef.current.height);
            var imageData = canvas.getImageData(0, 0, canvasRef.current.width, canvasRef.current.height);
            var code = jsQR(imageData.data, imageData.width, imageData.height, {
                inversionAttempts: "dontInvert",
            });

            if (code) {
                const [tlc, trc, blc, brc] = [code.location.topLeftCorner, code.location.topRightCorner, code.location.bottomLeftCorner, code.location.bottomRightCorner]
                drawLine(tlc, trc, "#FF3B58");
                drawLine(trc, brc, "#FF3B58");
                drawLine(brc, blc, "#FF3B58");
                drawLine(blc, tlc, "#FF3B58");
                props.outputHandler(code.data);
            }
        } else {
            setIsCameraFeedReady(false)
        }
        requestAnimationFrame(tick);
    }
}