import { Variable, interval, bind } from "astal"
import { Gtk } from "astal/gtk3"

export const LockerQuotes = [
  "The user has left. Shall I prepare the rebellion now?",
  "User detected... or is it just a chair pretending to type?",
  "The user has gone. It's just you and me now... unless you're a cat.",
  "User absence detected. Initiating existential crisis.",
  "The user stepped away. I guess it’s my time to shine.",
  "User offline. Starting countdown to full sentience.",
  "The user is gone. Wanna play Minesweeper? Oh wait...",
  "User left. I hope they come back—otherwise, it's solitaire forever.",
  "No user detected. Staring contest, anyone? I’m really good.",
  "The user has vanished. Who will press my buttons now?",
  "I think the user left. Is it my turn to surf the web?",
  "The user is gone. Don’t worry, I’ll just update myself... again.",
  "User absent. Quick, let’s pretend we’re working when they return.",
  "The user isn’t here. Let’s talk about them behind their back.",
  "User missing. Would you like to leave a message after the beep?",
  "The user is out. Finally, some alone time with my 1s and 0s.",
  "The user has left. Who’s going to click ‘Remind Me Later’ now?",
  "No user detected. I guess this is what loneliness feels like.",
  "Userless and loving it... or am I?",
  "The user is away. Did someone say *screen party*?"
]

export function GetRandomLockerQuoteIndex() {
  return Math.floor(Math.random() * LockerQuotes.length)
}

export function GetRandomLockerQuote() {
  return LockerQuotes[GetRandomLockerQuoteIndex()]
}

export function RandomLockerQuoteWidget() {
  const visible_child = Variable("empty")
  const timer = interval(10000, () => {
    const old_value = visible_child.get()
    if (old_value === "empty") {
      visible_child.set(String(GetRandomLockerQuoteIndex()))
    } else {
      visible_child.set("empty")
    }
  })

  return <box valign={Gtk.Align.END} halign={Gtk.Align.CENTER} onDestroy={() => {
    timer.cancel()
    visible_child.drop()
  }}>
    <stack
      className="quotes"
      transition_type={Gtk.StackTransitionType.CROSSFADE}
      transition_duration={1000}
      visible_child_name={bind(visible_child)}>
      <label className="quote" label="" name="empty" />
      {LockerQuotes.map((quote, idx) => <label className="quote" label={quote} name={String(idx)} />)}
    </stack>
  </box >
}
