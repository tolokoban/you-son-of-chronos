import React from "react"
import Tfw from 'tfw'

import "./app.css"
import DingURL from './ding.mp3'

const Combo = Tfw.View.Combo
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
}

interface ISound {
    time: number
    speech: string
}

const INTERVAL = 50
const DELAY_AFTER_DING = 1200
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
        play: false
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
        if (text.charAt(0) === '#') {
            // Countdown.
            const utter = new SpeechSynthesisUtterance(text.substr(1))
            const voice = this.voices[this.state.voice]
            if (voice) utter.voice = voice
            utter.pitch = 1.4
            utter.rate = 1
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
        this.sounds = []

        const exercicesCount = Tfw.Converter.Integer(this.state.exercicesCount, 0)
        const exercicesDuration = Tfw.Converter.Integer(this.state.exercicesDuration, 0)
        const repetitionsCount = Tfw.Converter.Integer(this.state.repetitionsCount, 0)
        const pauseBetweenRepetitions = Tfw.Converter.Integer(this.state.pauseBetweenRepetitions, 0)
        let time = 0

        for (let idxRepetition = 0; idxRepetition < repetitionsCount; idxRepetition++) {
            if (idxRepetition > 0) {
                // countdown.
                for (let count = 1; count <= COUNTDOWN; count++) {
                    this.sounds.push({ time: time - count, speech: `#${count}` })
                }
                this.sounds.push({ time, speech: `Pause de ${pauseBetweenRepetitions} secondes.` })
                time += pauseBetweenRepetitions
            }
            for (let idxExercise = 0; idxExercise < exercicesCount; idxExercise++) {
                if (idxRepetition > 0 || idxExercise > 0) {
                    // countdown.
                    for (let count = 1; count <= COUNTDOWN; count++) {
                        this.sounds.push({ time: time - count, speech: `#${count}` })
                    }
                }
                this.sounds.push({ time, speech: `Exercice ${idxExercise + 1} sur ${exercicesCount}` })
                time += exercicesDuration
            }
        }
        // countdown.
        for (let count = 1; count <= COUNTDOWN; count++) {
            this.sounds.push({ time: time - count, speech: `#${count}` })
        }
        this.sounds.push({ time, speech: `Bravo ! Cette session est terminée.` })
        this.sounds.sort((a, b) => a.time - b.time)
        this.time = Date.now()
        this.interval = window.setInterval(this.checkTime, INTERVAL)
        this.setState({ play: true })
    }

    handleStop = () => {
        window.clearInterval(this.interval)
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
        const voices = Object.keys(this.voices)
        console.info("voices=", voices)

        return (<div className={classes.join(' ')}>
            <div className="input">
                {
                    voices.length > 0 &&
                    <Combo
                        wide={true}
                        label="Coach's voice"
                        value={this.state.voice}
                        onChange={this.handleVoiceChange}>
                        {
                            voices.map(voiceName => <div key={voiceName}>{voiceName}</div>)
                        }
                    </Combo>
                }
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
