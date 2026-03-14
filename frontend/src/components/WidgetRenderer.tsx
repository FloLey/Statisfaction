import { useEffect, useRef, useState } from "react";
import type { IdeaWidget } from "../api";

interface Props {
  widget: IdeaWidget;
}

export default function WidgetRenderer({ widget }: Props) {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [height, setHeight] = useState(280);
  const containerRef = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const obs = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) setVisible(true); },
      { threshold: 0.1 }
    );
    if (containerRef.current) obs.observe(containerRef.current);
    return () => obs.disconnect();
  }, []);

  // Resize iframe to content height via postMessage
  useEffect(() => {
    function onMessage(e: MessageEvent) {
      if (e.data?.type === "resize" && typeof e.data.height === "number") {
        setHeight(e.data.height + 24);
      }
    }
    window.addEventListener("message", onMessage);
    return () => window.removeEventListener("message", onMessage);
  }, []);

  const type = widget.widget_type;

  if (type === "html" && widget.content) {
    // Inject a resize reporter into the HTML
    const resizeScript = `<script>
      function reportSize(){
        const h=document.body.scrollHeight||document.documentElement.scrollHeight;
        parent.postMessage({type:'resize',height:h},'*');
      }
      window.addEventListener('load',reportSize);
      window.addEventListener('resize',reportSize);
      new ResizeObserver(reportSize).observe(document.body);
    <\/script>`;
    const src = widget.content.replace("</body>", `${resizeScript}</body>`);
    const blob = new Blob([src], { type: "text/html" });
    const url = URL.createObjectURL(blob);

    return (
      <div ref={containerRef} className="widget-container">
        {widget.title && <div className="widget-title">{widget.title}</div>}
        {widget.description && (
          <div className="widget-description">{widget.description}</div>
        )}
        {visible && (
          <iframe
            ref={iframeRef}
            src={url}
            sandbox="allow-scripts"
            style={{ width: "100%", height, border: "none", borderRadius: 6 }}
            title={widget.title ?? "Widget"}
          />
        )}
      </div>
    );
  }

  if ((type === "animated_svg" || type === "chart_svg") && widget.content) {
    return (
      <div ref={containerRef} className="widget-container">
        {widget.title && <div className="widget-title">{widget.title}</div>}
        {widget.description && (
          <div className="widget-description">{widget.description}</div>
        )}
        {visible && (
          <div
            className="widget-svg"
            dangerouslySetInnerHTML={{ __html: widget.content }}
          />
        )}
      </div>
    );
  }

  if (type === "video" && widget.content) {
    return (
      <div ref={containerRef} className="widget-container">
        {widget.title && <div className="widget-title">{widget.title}</div>}
        <video
          src={widget.content}
          controls
          loop
          style={{ width: "100%", borderRadius: 6 }}
        />
      </div>
    );
  }

  return null;
}
