"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";

interface MessageItem {
  id: string;
  sender: "user" | "bot";
  text?: string;
  flex?: any;
  timestamp: string;
}

export default function LineSimulatorPage() {
  const [chatType, setChatType] = useState<"group" | "private">("group");
  const [selectedGroupId, setSelectedGroupId] = useState("C-sci301-group");
  const [selectedUserId, setSelectedUserId] = useState("U_student_01");

  const [inputMessage, setInputMessage] = useState("");
  const [messages, setMessages] = useState<MessageItem[]>([
    {
      id: "welcome-1",
      sender: "bot",
      text: "👋 สวัสดีครับ! บ็อตจัดการชั้นเรียน UD-Class System พร้อมให้บริการแล้ว\n\nลองพิมพ์คำสั่ง:\n• #การบ้าน\n• #ไข่\n• #สมาชิก\n• #ทวงงาน\n• #เช็คชื่อ\n• #กลุ่ม",
      timestamp: "19:00",
    },
  ]);
  const [isTyping, setIsTyping] = useState(false);
  const chatBottomRef = useRef<HTMLDivElement>(null);

  const [classrooms, setClassrooms] = useState<any[]>([]);

  useEffect(() => {
    chatBottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isTyping]);

  useEffect(() => {
    fetch("/api/classrooms")
      .then((res) => res.json())
      .then((data) => {
        if (data.success && data.classrooms?.length > 0) {
          setClassrooms(data.classrooms);
          const firstWithLine = data.classrooms.find((c: any) => c.lineGroupId);
          if (firstWithLine) {
            setSelectedGroupId(firstWithLine.lineGroupId);
          }
        }
      })
      .catch((err) => console.error("Error loading simulator classrooms:", err));
  }, []);

  const sendMessage = async (text: string) => {
    if (!text.trim()) return;

    const userMsg: MessageItem = {
      id: `user-${Date.now()}`,
      sender: "user",
      text: text.trim(),
      timestamp: new Intl.DateTimeFormat("th-TH", { timeStyle: "short" }).format(new Date()),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputMessage("");
    setIsTyping(true);

    try {
      const res = await fetch("/api/line/test-simulate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "message",
          text: text.trim(),
          groupId: chatType === "group" ? selectedGroupId : undefined,
          userId: selectedUserId,
        }),
      });

      const data = await res.json();
      setIsTyping(false);

      if (data.success && data.replyMessages) {
        data.replyMessages.forEach((reply: any, idx: number) => {
          setTimeout(() => {
            const timeStr = new Intl.DateTimeFormat("th-TH", {
              timeStyle: "short",
            }).format(new Date());

            if (reply.type === "text") {
              setMessages((prev) => [
                ...prev,
                {
                  id: `bot-${Date.now()}-${idx}`,
                  sender: "bot",
                  text: reply.text,
                  timestamp: timeStr,
                },
              ]);
            } else if (reply.type === "flex") {
              setMessages((prev) => [
                ...prev,
                {
                  id: `bot-${Date.now()}-${idx}`,
                  sender: "bot",
                  flex: reply.contents,
                  timestamp: timeStr,
                },
              ]);
            }
          }, idx * 300);
        });
      }
    } catch (err) {
      setIsTyping(false);
      console.error(err);
    }
  };

  const sendPostback = async (postbackData: string) => {
    setIsTyping(true);
    try {
      const res = await fetch("/api/line/test-simulate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "postback",
          postbackData,
          groupId: chatType === "group" ? selectedGroupId : undefined,
          userId: selectedUserId,
        }),
      });

      const data = await res.json();
      setIsTyping(false);

      if (data.success && data.replyMessages) {
        data.replyMessages.forEach((reply: any, idx: number) => {
          const timeStr = new Intl.DateTimeFormat("th-TH", {
            timeStyle: "short",
          }).format(new Date());

          if (reply.type === "text") {
            setMessages((prev) => [
              ...prev,
              {
                id: `bot-${Date.now()}-${idx}`,
                sender: "bot",
                text: reply.text,
                timestamp: timeStr,
              },
            ]);
          } else if (reply.type === "flex") {
            setMessages((prev) => [
              ...prev,
              {
                id: `bot-${Date.now()}-${idx}`,
                sender: "bot",
                flex: reply.contents,
                timestamp: timeStr,
              },
            ]);
          }
        });
      }
    } catch (err) {
      setIsTyping(false);
      console.error(err);
    }
  };

  const simulateJoinGroup = async () => {
    setIsTyping(true);
    try {
      const res = await fetch("/api/line/test-simulate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "join",
          groupId: selectedGroupId,
          userId: selectedUserId,
        }),
      });
      const data = await res.json();
      setIsTyping(false);

      if (data.success && data.replyMessages) {
        data.replyMessages.forEach((reply: any, idx: number) => {
          const timeStr = new Intl.DateTimeFormat("th-TH", {
            timeStyle: "short",
          }).format(new Date());

          setMessages((prev) => [
            ...prev,
            {
              id: `bot-join-${Date.now()}-${idx}`,
              sender: "bot",
              flex: reply.contents,
              timestamp: timeStr,
            },
          ]);
        });
      }
    } catch (err) {
      setIsTyping(false);
    }
  };

  // Renderer สำหรับ LINE Flex Message Bubble
  const renderFlexBubble = (bubble: any) => {
    const header = bubble.header;
    const hero = bubble.hero;
    const body = bubble.body;
    const footer = bubble.footer;

    return (
      <div className="bg-white rounded-2xl overflow-hidden shadow-lg border border-slate-200/80 text-slate-800 text-xs w-full max-w-[340px] my-1">
        {/* Flex Header */}
        {header && (
          <div
            className="p-4 text-white"
            style={{ backgroundColor: header.backgroundColor || "#06C755" }}
          >
            {header.contents?.map((c: any, i: number) => {
              if (c.type === "box" && c.layout === "horizontal") {
                return (
                  <div key={i} className="flex items-center justify-between">
                    <span className="font-bold text-xs" style={{ color: c.contents[0]?.color }}>
                      {c.contents[0]?.text}
                    </span>
                    <span className="font-bold text-xs" style={{ color: c.contents[1]?.color }}>
                      {c.contents[1]?.text}
                    </span>
                  </div>
                );
              }
              return (
                <div key={i} className="font-bold text-base mt-1" style={{ color: c.color || "#fff" }}>
                  {c.text}
                </div>
              );
            })}
          </div>
        )}

        {/* Flex Hero Image */}
        {hero && hero.type === "image" && (
          <div className="w-full h-36 overflow-hidden bg-slate-100">
            <img src={hero.url} alt="hero" className="w-full h-full object-cover" />
          </div>
        )}

        {/* Flex Body */}
        {body && (
          <div className="p-4 space-y-2.5">
            {body.contents?.map((c: any, i: number) => {
              if (c.type === "separator") {
                return <hr key={i} className="border-slate-100 my-2" />;
              }
              if (c.type === "text") {
                return (
                  <div
                    key={i}
                    className="leading-relaxed"
                    style={{
                      color: c.color || "#4b5563",
                      fontWeight: c.weight === "bold" ? "700" : "400",
                      fontSize: c.size === "lg" ? "14px" : c.size === "xs" ? "11px" : "12px",
                    }}
                  >
                    {c.text}
                  </div>
                );
              }
              if (c.type === "box" && c.layout === "horizontal") {
                return (
                  <div key={i} className="flex items-center justify-between text-[11px]">
                    <span style={{ color: c.contents[0]?.color || "#6b7280" }}>
                      {c.contents[0]?.text}
                    </span>
                    <span
                      style={{
                        color: c.contents[1]?.color || "#111827",
                        fontWeight: c.contents[1]?.weight === "bold" ? "700" : "500",
                      }}
                    >
                      {c.contents[1]?.text}
                    </span>
                  </div>
                );
              }
              if (c.type === "box" && c.layout === "vertical" && c.backgroundColor) {
                return (
                  <div
                    key={i}
                    className="p-2.5 rounded-lg text-center"
                    style={{ backgroundColor: c.backgroundColor }}
                  >
                    {c.contents?.map((inner: any, j: number) => (
                      <div
                        key={j}
                        style={{
                          color: inner.color,
                          fontWeight: inner.weight === "bold" ? "800" : "500",
                          fontSize: inner.size === "xl" ? "16px" : "10px",
                        }}
                      >
                        {inner.text}
                      </div>
                    ))}
                  </div>
                );
              }
              return null;
            })}
          </div>
        )}

        {/* Flex Footer Buttons */}
        {footer && (
          <div className="p-3 bg-slate-50 border-t border-slate-100 space-y-2">
            {footer.contents?.map((btn: any, i: number) => {
              if (btn.action?.type === "uri") {
                return (
                  <Link
                    key={i}
                    href={btn.action.uri.replace("http://localhost:3000", "")}
                    className="w-full py-2 px-3 rounded-xl text-center text-xs font-bold block transition"
                    style={{
                      backgroundColor: btn.color || "#06C755",
                      color: "#fff",
                    }}
                  >
                    {btn.action.label}
                  </Link>
                );
              }
              if (btn.action?.type === "postback") {
                return (
                  <button
                    key={i}
                    onClick={() => sendPostback(btn.action.data)}
                    className="w-full py-2 px-3 rounded-xl text-center text-xs font-bold transition"
                    style={{
                      backgroundColor: btn.color || "#1e293b",
                      color: "#fff",
                    }}
                  >
                    {btn.action.label}
                  </button>
                );
              }
              if (btn.action?.type === "message") {
                return (
                  <button
                    key={i}
                    onClick={() => sendMessage(btn.action.text)}
                    className="w-full py-2 px-3 rounded-xl text-center text-xs font-semibold bg-slate-200 hover:bg-slate-300 text-slate-800 transition"
                  >
                    {btn.action.label}
                  </button>
                );
              }
              return null;
            })}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
            <h2 className="text-2xl font-black text-slate-900 tracking-tight">
              จำลอง LINE Bot (LINE Bot Live Chat Simulator)
            </h2>
          </div>
          <p className="text-xs text-slate-500">
            ทดสอบคำสั่งบ็อต การ์ด Flex Message และการตอบกลับได้ทันทีโดยไม่ต้องเปิด ngrok หรือตั้งค่าจริง
          </p>
        </div>

        <button
          onClick={simulateJoinGroup}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-500 text-white transition shadow-sm"
        >
          <span>🤖</span>
          <span>จำลองบ็อตเข้ากลุ่ม (Join Event)</span>
        </button>
      </div>

      {/* Simulator Workspace Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Context Settings & Quick Commands (5 cols) */}
        <div className="lg:col-span-5 space-y-4">
          {/* Environment Controls */}
          <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm space-y-4 text-xs">
            <h3 className="font-bold text-slate-900 text-sm">
              ⚙️ ตั้งค่าสภาพแวดล้อมการจำลอง
            </h3>

            <div>
              <label className="block text-slate-700 font-semibold mb-1">
                ประเภทแชท
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setChatType("group")}
                  className={`py-2 rounded-xl font-bold transition ${
                    chatType === "group"
                      ? "bg-slate-900 text-white"
                      : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                  }`}
                >
                  👥 กลุ่ม LINE (Group)
                </button>
                <button
                  type="button"
                  onClick={() => setChatType("private")}
                  className={`py-2 rounded-xl font-bold transition ${
                    chatType === "private"
                      ? "bg-slate-900 text-white"
                      : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                  }`}
                >
                  💬 แชทเดี่ยว (Direct)
                </button>
              </div>
            </div>

            {chatType === "group" && (
              <div>
                <label className="block text-slate-700 font-semibold mb-1">
                  LINE Group ID
                </label>
                <select
                  value={selectedGroupId}
                  onChange={(e) => setSelectedGroupId(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl bg-white text-xs"
                >
                  {classrooms.length > 0 ? (
                    classrooms.map((c) => (
                      <option
                        key={c.id}
                        value={c.lineGroupId || `GROUP_${c.id}`}
                      >
                        {c.name} {c.lineGroupId ? `(${c.lineGroupId})` : "(ยังไม่ได้กำหนด ID)"}
                      </option>
                    ))
                  ) : (
                    <>
                      <option value="C-sci301-group">
                        วิทยาศาสตร์ ม.3/1 (C-sci301-group)
                      </option>
                      <option value="C-math302-group">
                        คณิตศาสตร์ ม.3/2 (C-math302-group)
                      </option>
                    </>
                  )}
                  <option value="C-unknown-new-group">
                    กลุ่มใหม่ที่ยังไม่เคยผูก (C-unknown-new-group)
                  </option>
                </select>
              </div>
            )}

            <div>
              <label className="block text-slate-700 font-semibold mb-1">
                ผู้ส่งข้อความ (Simulated User)
              </label>
              <select
                value={selectedUserId}
                onChange={(e) => setSelectedUserId(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-xl"
              >
                <option value="U_student_01">
                  ด.ช. กิตติศักดิ์ เจริญพร (เลขที่ 1 - ผูกแล้ว)
                </option>
                <option value="U_student_02">
                  ด.ช. ชัยวัฒน์ มั่นคง (เลขที่ 2 - ผูกแล้ว)
                </option>
                <option value="U_student_03">
                  ด.ญ. ณัฐณิชา ศรีสุข (เลขที่ 3 - มีมอนสเตอร์แล้ว)
                </option>
                <option value="U_student_unregistered">
                  นักเรียนใหม่ (ยังไม่ได้พิมพ์ #ลงทะเบียน)
                </option>
                <option value="U_teacher_chedtha">
                  ครูเชษฐ์ พัฒนาวิชาการ (Teacher)
                </option>
              </select>
            </div>
          </div>

          {/* Quick Command Buttons Palette */}
          <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm space-y-3">
            <h3 className="font-bold text-slate-900 text-sm">
              ⚡ กดส่งคำสั่งลัดทันที
            </h3>
            <p className="text-slate-500 text-xs">
              คลิกปุ่มเพื่อส่งข้อความเข้าห้องแชทจำลองโดยไม่ต้องพิมพ์:
            </p>

            <div className="grid grid-cols-2 gap-2 text-xs">
              <button
                onClick={() => sendMessage("#การบ้าน")}
                className="p-2.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-800 font-bold border border-emerald-200 text-left transition"
              >
                <span className="block text-sm">📝 #การบ้าน</span>
                <span className="text-[10px] text-emerald-600 font-normal">ดูการบ้าน & ลิงก์ส่งงาน</span>
              </button>

              <button
                onClick={() => sendMessage("#ไข่")}
                className="p-2.5 rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-800 font-bold border border-amber-200 text-left transition"
              >
                <span className="block text-sm">🥚 #ไข่</span>
                <span className="text-[10px] text-amber-600 font-normal">เช็คสถานะไข่ & มอนสเตอร์</span>
              </button>

              <button
                onClick={() => sendMessage("#ลงทะเบียน 2")}
                className="p-2.5 rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-800 font-bold border border-blue-200 text-left transition"
              >
                <span className="block text-sm">📲 #ลงทะเบียน 2</span>
                <span className="text-[10px] text-blue-600 font-normal">ผูกบัญชีกับเลขที่ 2</span>
              </button>

              <button
                onClick={() => sendMessage("#ทวงงาน")}
                className="p-2.5 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-800 font-bold border border-rose-200 text-left transition"
              >
                <span className="block text-sm">🚨 #ทวงงาน</span>
                <span className="text-[10px] text-rose-600 font-normal">สรุปคนค้างส่งเข้ากลุ่ม</span>
              </button>

              <button
                onClick={() => sendMessage("#สมาชิก")}
                className="p-2.5 rounded-xl bg-purple-50 hover:bg-purple-100 text-purple-800 font-bold border border-purple-200 text-left transition"
              >
                <span className="block text-sm">🎒 #สมาชิก</span>
                <span className="text-[10px] text-purple-600 font-normal">ดูรายชื่อและแต้มสะสม</span>
              </button>

              <button
                onClick={() => sendMessage("#เช็คชื่อ")}
                className="p-2.5 rounded-xl bg-cyan-50 hover:bg-cyan-100 text-cyan-800 font-bold border border-cyan-200 text-left transition"
              >
                <span className="block text-sm">📋 #เช็คชื่อ</span>
                <span className="text-[10px] text-cyan-600 font-normal">ดูสถิติการมาเรียนวันนี้</span>
              </button>

              <button
                onClick={() => sendMessage("#กลุ่ม")}
                className="col-span-2 p-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold border border-slate-200 text-left transition"
              >
                <span className="block text-sm">🏫 #กลุ่ม</span>
                <span className="text-[10px] text-slate-500 font-normal">ตรวจสอบข้อมูลห้องเรียนและ Group ID ที่ผูก</span>
              </button>
            </div>
          </div>
        </div>

        {/* Right Column: Phone Mockup UI (7 cols) */}
        <div className="lg:col-span-7 flex justify-center">
          <div className="w-full max-w-[420px] bg-slate-900 rounded-[38px] p-3 shadow-2xl border-4 border-slate-800">
            {/* Phone Screen */}
            <div className="bg-[#78909c] h-[640px] rounded-[30px] flex flex-col overflow-hidden relative">
              {/* LINE Header */}
              <div className="bg-[#20272b] text-white px-4 py-3 flex items-center justify-between shadow-sm z-10">
                <div className="flex items-center gap-2">
                  <span className="text-xs">‹</span>
                  <div className="w-8 h-8 rounded-full overflow-hidden bg-white flex items-center justify-center p-0.5 border border-slate-700 flex-shrink-0">
                    <img src="/logo.jpg" alt="UD-Class" className="w-full h-full object-contain rounded-full" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold leading-tight">
                      {chatType === "group" ? "กลุ่มวิทยาศาสตร์ ม.3/1" : "UD-Class Bot"}
                    </h4>
                    <p className="text-[10px] text-emerald-400">
                      {chatType === "group" ? "สมาชิก 9 คน" : "Official Account"}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 text-xs">
                  <span>🔍</span>
                  <span>☰</span>
                </div>
              </div>

              {/* Chat Messages Stream */}
              <div className="flex-1 overflow-y-auto p-4 space-y-3">
                {messages.map((m) => {
                  const isUser = m.sender === "user";

                  return (
                    <div
                      key={m.id}
                      className={`flex flex-col ${isUser ? "items-end" : "items-start"}`}
                    >
                      {/* Message Content */}
                      {m.flex ? (
                        renderFlexBubble(m.flex)
                      ) : (
                        <div
                          className={`max-w-[85%] rounded-2xl px-3.5 py-2.5 text-xs whitespace-pre-wrap leading-relaxed shadow-sm ${
                            isUser
                              ? "bg-[#06C755] text-white rounded-tr-none"
                              : "bg-white text-slate-800 rounded-tl-none border border-slate-200"
                          }`}
                        >
                          {m.text}
                        </div>
                      )}

                      {/* Timestamp */}
                      <span className="text-[9px] text-slate-200 mt-1 px-1">
                        {m.timestamp}
                      </span>
                    </div>
                  );
                })}

                {isTyping && (
                  <div className="flex items-center gap-1.5 bg-white/80 backdrop-blur px-3 py-1.5 rounded-full w-fit">
                    <span className="w-1.5 h-1.5 rounded-full bg-slate-500 animate-bounce" />
                    <span className="w-1.5 h-1.5 rounded-full bg-slate-500 animate-bounce [animation-delay:0.2s]" />
                    <span className="w-1.5 h-1.5 rounded-full bg-slate-500 animate-bounce [animation-delay:0.4s]" />
                  </div>
                )}

                <div ref={chatBottomRef} />
              </div>

              {/* LINE Input Bar */}
              <div className="p-2.5 bg-[#20272b] flex items-center gap-2">
                <span className="text-slate-400 text-sm cursor-pointer">➕</span>
                <input
                  type="text"
                  placeholder="พิมพ์ข้อความ เช่น #การบ้าน..."
                  value={inputMessage}
                  onChange={(e) => setInputMessage(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") sendMessage(inputMessage);
                  }}
                  className="flex-1 bg-slate-800 text-white text-xs px-3 py-2 rounded-full border border-slate-700 focus:outline-none focus:border-emerald-500"
                />
                <button
                  onClick={() => sendMessage(inputMessage)}
                  className="w-8 h-8 rounded-full bg-[#06C755] hover:bg-emerald-600 flex items-center justify-center text-white text-xs font-bold transition flex-shrink-0"
                >
                  ➤
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
