import React from "react"
import Tfw from 'tfw'

import "./app.css"

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

const INTERVAL = 200

export default class App extends React.Component<IAppProps, IAppState> {
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
        window.speechSynthesis.getVoices()
            .filter(voice => voice.lang.startsWith("en"))
            .forEach(voice => {
                this.voices[voice.name] = voice
            })
        this.setState(
            { voice: Object.keys(this.voices)[0] },
            () => this.speak("Bienvenue à la prière au soleil!")
        )
    }

    speak(text: string) {
        console.log(text)
        const voice = this.voices[this.state.voice]
        if (!voice) return
        const utter = new SpeechSynthesisUtterance(text)
        //utter.voice = voice
        utter.pitch = 1
        utter.rate = 1
        window.speechSynthesis.speak(utter)
    }

    handleVoiceChange = (voiceName: string) => {
        this.setState({ voice: voiceName })
        const voice = this.voices[voiceName]
        if (!voice) return

        this.speak("Hello guys! My name is Alfred: I am your personal coach.")
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
                this.sounds.push({ time, speech: "Pause" })
                time += pauseBetweenRepetitions
            }
            for (let idxExercise = 0; idxExercise < exercicesCount; idxExercise++) {
                this.sounds.push({ time, speech: `Exercise ${idxExercise + 1} of ${exercicesCount}` })
                time += exercicesDuration
            }
        }
        this.sounds.push({ time, speech: `Well done!` })

        this.time = Date.now()
        this.interval = window.setInterval(this.checkTime, INTERVAL)
        this.setState({ play: true })
    }

    handleStop = () => {
        window.clearInterval(this.interval)
        this.setState({ play: false }, () => this.speak("This session has been aborted!"))
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
                <Combo
                    wide={true}
                    label="Coach's voice"
                    value={this.state.voice}
                    onChange={this.handleVoiceChange}>
                    {
                        voices.map(voiceName => <div key={voiceName}>{voiceName}</div>)
                    }
                </Combo>
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
        </div >)
    }
}
