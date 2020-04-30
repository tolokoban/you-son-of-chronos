import React from "react"
import Tfw from 'tfw'
import Wake from './wake'

import Cfg from '../config.json'
import "./app.css"
import DingURL from './ding.mp3'

const VERSION = `${Cfg.name} v${Cfg.version}`

const Icon = Tfw.View.Icon
const Input = Tfw.View.Input

interface IAppProps {
    className?: string[]
}
interface IAppState {
    exercicesCount: string
    exercicesDuration: string
    repetitionsCount: string
    pauseBetweenRepetitions: string
    voice: string
    play: boolean
    remainingTime: string
}

interface ISound {
    time: number
    speech: string
}

interface IProgress {
    exercise: number
    repetition: number
}

const INTERVAL = 40
const DELAY_AFTER_DING = 1000
const COUNTDOWN = 5

export default class App extends React.Component<IAppProps, IAppState> {
    private refAudio = React.createRef<HTMLAudioElement>()
    private time = 0
    private interval = 0
    private sounds: ISound[] = []
    private voices: { [key: string]: SpeechSynthesisVoice } = {}

    state = {
        exercicesCount: "5",
        exercicesDuration: "30",
        repetitionsCount: "3",
        pauseBetweenRepetitions: "60",
        voice: "",
        play: false,
        remainingTime: ""
    }

    componentDidMount() {
        if ('speechSynthesis' in window) {
            console.info("window.speechSynthesis=", window.speechSynthesis)
            window.speechSynthesis.getVoices()
                .filter(voice => voice.lang.startsWith("fr"))
                .forEach(voice => {
                    this.voices[voice.name] = voice
                })
            this.setState({ voice: Object.keys(this.voices)[0] })
            window.setTimeout(
                () => this.speak("#Bienvenue à la prière au soleil!"),
                DELAY_AFTER_DING
            )

        } else {
            Tfw.Factory.Dialog.error("No speech synthesis on this device!")
        }
    }

    speak(text: string) {
        console.log("speak:", text)
        if (text.charAt(0) === '#') {
            // Countdown.
            const utter = new SpeechSynthesisUtterance(text.substr(1))
            const voice = this.voices[this.state.voice]
            if (voice) utter.voice = voice
            utter.pitch = 1.5
            utter.rate = 1.1
            window.speechSynthesis.speak(utter)

            return
        }

        const audio = this.refAudio.current
        if (audio) {
            audio.play()
        }
        window.setTimeout(
            () => {
                const utter = new SpeechSynthesisUtterance(text)
                const voice = this.voices[this.state.voice]
                if (voice) utter.voice = voice
                utter.pitch = 0.9
                utter.rate = 1.2
                window.speechSynthesis.speak(utter)
            },
            DELAY_AFTER_DING
        )
    }

    handleVoiceChange = (voiceName: string) => {
        this.setState({ voice: voiceName })
        const voice = this.voices[voiceName]
        if (!voice) return

        this.speak("Vous aimez ma voix ?")
    }

    handleStart = () => {
        Wake.lockScreen()

        this.sounds = []

        const exercicesCount = Tfw.Converter.Integer(this.state.exercicesCount, 0)
        const exercicesDuration = Tfw.Converter.Integer(this.state.exercicesDuration, 0)
        const repetitionsCount = Tfw.Converter.Integer(this.state.repetitionsCount, 0)
        const pauseBetweenRepetitions = Tfw.Converter.Integer(this.state.pauseBetweenRepetitions, 0)
        let time = 0
        const TIME_WITHOUT_COUNTDOWN = 5

        for (let idxRepetition = 0; idxRepetition < repetitionsCount; idxRepetition++) {
            if (idxRepetition > 0) {
                // countdown.
                for (let count = 1; count <= Math.min(COUNTDOWN, pauseBetweenRepetitions - TIME_WITHOUT_COUNTDOWN); count++) {
                    this.sounds.push({ time: time - count, speech: `#${count}` })
                }
                this.sounds.push({ time, speech: `Pause de ${pauseBetweenRepetitions} secondes.` })
                time += pauseBetweenRepetitions
            }
            for (let idxExercise = 0; idxExercise < exercicesCount; idxExercise++) {
                if (idxRepetition > 0 || idxExercise > 0) {
                    // countdown.
                    for (let count = 1; count <= Math.min(COUNTDOWN, exercicesDuration - TIME_WITHOUT_COUNTDOWN); count++) {
                        this.sounds.push({ time: time - count, speech: `#${count}` })
                    }
                }
                this.sounds.push({ time, speech: `Exercice ${idxExercise + 1} sur ${exercicesCount}` })
                time += exercicesDuration
            }
        }
        // countdown.
        for (let count = 1; count <= Math.min(COUNTDOWN, exercicesDuration - TIME_WITHOUT_COUNTDOWN); count++) {
            this.sounds.push({ time: time - count, speech: `#${count}` })
        }
        this.sounds.push({ time, speech: `Bravo ! Cette session est terminée.` })
        this.sounds.sort((a, b) => a.time - b.time)
        for (const sound of this.sounds) {
            console.log(sound.time, sound.speech)
        }
        this.time = Date.now()
        this.interval = window.setInterval(this.checkTime, INTERVAL)
        this.setState({ play: true })
    }

    handleStop = () => {
        Wake.unlockScreen()

        this.sounds = []
        window.clearInterval(this.interval)
        this.interval = 0
        this.setState({ play: false }, () => this.speak("Cette session vient d'être annulée."))
    }

    checkTime = () => {
        const MILLISEC_TO_SEC = 0.001
        const time = (Date.now() - this.time) * MILLISEC_TO_SEC
        const { sounds } = this
        if (sounds.length < 1) {
            this.setState({ play: false })
            return
        }

        for (const s of sounds) {
            if (s.speech.charAt(0) === '#') continue
            const remainingTime = Math.ceil(s.time - time)
            const text = `${remainingTime > 0 ? remainingTime : ""}`
            if (text !== this.state.remainingTime) {
                this.setState({
                    remainingTime: text
                })
            }
            break
        }

        const sound = sounds[0]
        if (sound.time > time) return
        sounds.shift()
        this.speak(sound.speech)
    }

    render() {
        const classes = [
            'App', 'thm-bg0',
            ...Tfw.Converter.StringArray(this.props.className, [])
        ]

        return (<div className={classes.join(' ')}>
            <header className="thm-bgP thm-ele-bar">
                <div>{VERSION}</div>
                <div>{this.state.remainingTime}</div>
            </header>
            <div className="input">
                <div className="input">
                    <Input
                        wide={true}
                        label="Exercices Count"
                        storage="exercicesCount"
                        value={this.state.exercicesCount}
                        onChange={exercicesCount => this.setState({ exercicesCount })} />
                    <Input
                        wide={true}
                        label="Exercices Duration"
                        storage="exercicesDuration"
                        value={this.state.exercicesDuration}
                        onChange={exercicesDuration => this.setState({ exercicesDuration })} />
                </div>
                <div className="input">
                    <Input
                        wide={true}
                        label="Repetitions Count"
                        storage="repetitionsCount"
                        value={this.state.repetitionsCount}
                        onChange={repetitionsCount => this.setState({ repetitionsCount })} />
                    <Input
                        wide={true}
                        label="Pause Duration"
                        storage="pauseBetweenRepetitions"
                        value={this.state.pauseBetweenRepetitions}
                        onChange={pauseBetweenRepetitions => this.setState({ pauseBetweenRepetitions })} />
                </div>
            </div>
            <div className="play" >
                {
                    !this.state.play &&
                    <button className="button thm-bgP thm-ele-nav" onClick={this.handleStart}>
                        <Icon
                            content="play"
                            size="30vmin" />
                    </button>
                }
                {
                    this.state.play &&
                    <button className="button thm-bgS thm-ele-nav" onClick={this.handleStop}>
                        <Icon
                            content="pause"
                            size="30vmin" />
                    </button>
                }
            </div >
            <audio src={DingURL} ref={this.refAudio} />
        </div >)
    }
}
