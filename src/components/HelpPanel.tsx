import { Phone, PlaySquare, Settings, Lightbulb } from 'lucide-react';

export default function HelpPanel() {
  return (
    <div className="flex flex-col h-full bg-zinc-900/50 rounded-3xl border border-zinc-800 p-6 overflow-y-auto custom-scrollbar">
      <div className="mb-8 space-y-2">
        <h2 className="text-2xl font-semibold flex items-center gap-3 text-white">
          <Lightbulb className="w-6 h-6 text-amber-500" />
          Mayra Commands & Tips
        </h2>
        <p className="text-sm text-zinc-400">
          Here are some cool prompts and features you can use to interact with me!
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Calls & Messages */}
        <div className="bg-zinc-950/50 rounded-2xl border border-zinc-800/50 p-6 space-y-4">
          <div className="flex items-center gap-3 text-emerald-400 mb-4">
            <Phone className="w-5 h-5" />
            <h3 className="font-medium text-lg">Call & Message Prompts</h3>
          </div>
          <ul className="space-y-3 text-sm text-zinc-300">
            <li className="flex gap-2">
              <span className="text-zinc-500">•</span>
              <span><strong>"Call [Name]"</strong> (Jaise: "Call Bhaiya")</span>
            </li>
            <li className="flex gap-2">
              <span className="text-zinc-500">•</span>
              <span><strong>"Send a WhatsApp message to [Name] saying [Your Message]"</strong> (Jaise: "WhatsApp message send karo Bhaiya ko ki main ghar aa raha hu")</span>
            </li>
            <li className="flex gap-2">
              <span className="text-zinc-500">•</span>
              <span><strong>"Read my unread messages"</strong> (Aaye hue naye messages padhkar sunane ke liye)</span>
            </li>
          </ul>
        </div>

        {/* YouTube & Media */}
        <div className="bg-zinc-950/50 rounded-2xl border border-zinc-800/50 p-6 space-y-4">
          <div className="flex items-center gap-3 text-rose-400 mb-4">
            <PlaySquare className="w-5 h-5" />
            <h3 className="font-medium text-lg">YouTube & Media</h3>
          </div>
          <ul className="space-y-3 text-sm text-zinc-300">
            <li className="flex gap-2">
              <span className="text-zinc-500">•</span>
              <span><strong>"Open YouTube and play [Song/Video Name]"</strong> (Jaise: "YouTube open karo aur Ashish Yadav ke gana bajao")</span>
            </li>
            <li className="flex gap-2">
              <span className="text-zinc-500">•</span>
              <span><strong>"Play heavy bass Bhojpuri songs on YouTube"</strong></span>
            </li>
            <li className="flex gap-2">
              <span className="text-zinc-500">•</span>
              <span><strong>"Pause video" / "Volume up"</strong></span>
            </li>
          </ul>
        </div>

        {/* Phone Settings */}
        <div className="bg-zinc-950/50 rounded-2xl border border-zinc-800/50 p-6 space-y-4">
          <div className="flex items-center gap-3 text-cyan-400 mb-4">
            <Settings className="w-5 h-5" />
            <h3 className="font-medium text-lg">Phone Settings & Tasks</h3>
          </div>
          <ul className="space-y-3 text-sm text-zinc-300">
            <li className="flex gap-2">
              <span className="text-zinc-500">•</span>
              <span><strong>"Turn on Flashlight" / "Turn off Flashlight"</strong></span>
            </li>
            <li className="flex gap-2">
              <span className="text-zinc-500">•</span>
              <span><strong>"Set an alarm for 6 AM tomorrow"</strong></span>
            </li>
            <li className="flex gap-2">
              <span className="text-zinc-500">•</span>
              <span><strong>"Take a screenshot"</strong></span>
            </li>
            <li className="flex gap-2">
              <span className="text-zinc-500">•</span>
              <span><strong>"Open Camera and take a selfie"</strong></span>
            </li>
          </ul>
        </div>

        {/* Important Tips */}
        <div className="bg-zinc-950/50 rounded-2xl border border-zinc-800/50 p-6 space-y-4">
          <div className="flex items-center gap-3 text-amber-400 mb-4">
            <Lightbulb className="w-5 h-5" />
            <h3 className="font-medium text-lg">Important Tips</h3>
          </div>
          <ul className="space-y-4 text-sm text-zinc-300">
            <li className="bg-zinc-900/50 p-3 rounded-xl border border-zinc-800/50">
              <strong className="text-zinc-100 block mb-1">Hands-free use:</strong>
              Apne phone ki settings me jaakar "Hey Google" feature turn on kar lein. Iske baad aap bina phone chhuye sirf "Hey Google" bolkar ye sare kaam karwa sakte hain.
            </li>
            <li className="bg-zinc-900/50 p-3 rounded-xl border border-zinc-800/50">
              <strong className="text-zinc-100 block mb-1">Permissions:</strong>
              Pehli baar call ya message karte waqt phone aapse Contacts aur Phone Call ki permission mangega, use Allow kar dein.
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}
