export default function playaudio() {
    return {
        dispatchCustomEvent(
            eventName,
            { data = undefined, element = document, handleIframe = false, id = undefined } = {}
        ) {
            let event

            if (undefined != data) {
                data = { detail: data }
                event = new CustomEvent(eventName, data)
            } else {
                if (typeof Event === 'function') {
                    event = new Event(eventName)
                } else {
                    event = document.createEvent('Event')
                    event.initEvent(eventName, true, true)
                }
            }
            if (undefined !== id) {
                event.id = id
            }

            if (handleIframe) {
                if (document.getElementById('js-iFrame')) {
                    document.getElementById('js-iFrame').contentWindow.document.dispatchEvent(event)
                }
                if (this.inIframe()) {
                    parent.document.dispatchEvent(event)
                }
            }

            element.dispatchEvent(event)
        },
        inIframe() {
            try {
                return window.self !== window.top
            } catch (e) {
                return true
            }
        },
        playerCount: 0,
        playlist: {},
        registerPlayer(duration, id) {
            let _player = {}
            _player.id = id
            _player.button = document.querySelector('#playbutton' + id)
            _player.playIcon = _player.button.querySelector('.js-playbutton')
            _player.pauseIcon = _player.button.querySelector('.js-pausebutton')
            _player.range = document.querySelector('#range' + id)
            _player.timeDisplay = document.querySelector('#timedisplay' + id)
            _player.audioElement = this.$el
            _player.audioSrc = this.$el.querySelector('source').src
            _player.duration = duration
            _player.currentlyPlaying = false
            _player.init = false
            _player.firstPlay = true

            // this.playerCount == 0 ? _player.range.parentNode.classList.remove('hidden') : _player.range.parentNode.classList.add('hidden')
            this.playerCount++

            this.playlist[id] = _player
        },
        listenToGlobalStop() {
            console.log('global listener init')
            document.addEventListener(
                'hr:global:stopOtherAVs',
                this.stopAllPlayersBecauseOfGlobalStop.bind(this)
            )
        },
        rangeInput(id) {
            if (this.playlist[id].init == false) {
                this.playAndStop(id)
                this.playAndStop(id)
            }
            this.playlist[id].audioElement.currentTime =
                (this.playlist[id].range.value / 1000) * this.playlist[id].audioElement.duration
        },
        setTime(duration, id) {
            console.log('time set: ' + duration)

            let parts = duration.split(':')
            if (parts.length < 3) {
                let minutes = +parts[0]
                let seconds = +parts[1]
                var durationSeconds = (minutes * 60 + seconds).toFixed(3)
            } else {
                let hours = +parts[0]
                let minutes = +parts[1]
                let seconds = +parts[2]
                var durationSeconds = (hours * 3600 + minutes * 60 + seconds).toFixed(3)
            }

            let range = document.getElementById('range' + id)
            range.value = 0
            this.$el.querySelector('.js-currentTime').innerHTML = this.fancyTimeFormat('0', false)
            this.$el.querySelector('.js-audioDuration').innerHTML = this.fancyTimeFormat(
                durationSeconds,
                true
            )
        },

        updateCurrentTime(range, timeDisplay, newTime, id) {
            let darkmodeColor;
            window.matchMedia('(prefers-color-scheme: dark)').matches && document.getElementsByTagName('html')[0].classList.contains('tw-dark') ? darkmodeColor = "var(--color-podcast) " : darkmodeColor = "white "

            timeDisplay.querySelector('.js-currentTime').innerHTML = this.fancyTimeFormat(
                newTime,
                false
            )
            range.style.background =
                'linear-gradient(to right, var(--color-podcast) ' +
                range.value / 10 +
                '%,'+ darkmodeColor +
                range.value / 10 +
                '% )'
            range.value = ((100 * newTime) / this.playlist[id].audioElement.duration) * 10
        },

        playAndStop(id) {
            console.log('event target: ' + this.$event.currentTarget.id)
            console.log('playlist: ', this.playlist)
            if (this.playlist[id].init == true) {
                this.stopAudio(id)
            } else {
                this.stopAllOtherPlayers(id, false)
                this.startAudio(id)
                this.playlist[id].range.parentNode.classList.remove('max-h-0')
                this.playlist[id].range.parentNode.classList.add('max-h-9')
                this.playlist[id].playIcon.classList.add('hidden')
                this.playlist[id].pauseIcon.classList.remove('hidden')
                this.dispatchCustomEvent('hr:global:stopOtherAVs', { handleIframe: true, id: id })
            }
        },

        stopAllOtherPlayers(id, preventMinimize) {
            for (const index in this.playlist) {
                if (index != id) {
                    console.log('STOP: ', index)
                    this.stopAudio(index)
                    if (!preventMinimize) {
                        this.playlist[index].range.parentNode.classList.add('max-h-0')
                        this.playlist[index].range.parentNode.classList.remove('max-h-9')
                    }
                }
            }
        },
        stopAllPlayersBecauseOfGlobalStop(event) {
            this.stopAllOtherPlayers(event.id, true)
        },
        startAudio(id) {
            console.log('start audio ' + id)
            if (this.playlist[id].init == false) {
                this.initAudioEventListener(id)
                this.playlist[id].init = true
            }
            this.playlist[id].audioElement.play()
            this.playlist[id].currentlyPlaying = true
        },

        stopAudio(id) {
            this.playlist[id].audioElement.pause()
            this.playlist[id].init = false
            this.playlist[id].currentlyPlaying = false
            this.playlist[id].playIcon.classList.remove('hidden')
            this.playlist[id].pauseIcon.classList.add('hidden')
        },

        initAudioEventListener(id) {
            let _audioElement = this.playlist[id].audioElement
            let _range = this.playlist[id].range
            let _timeDisplay = this.playlist[id].timeDisplay
            _audioElement.ontimeupdate = (event) => {
                this.updateCurrentTime(_range, _timeDisplay, _audioElement.currentTime, id)
            }
        },

        fancyTimeFormat(duration, measure) {
            var hrs = ~~(duration / 3600)
            var mins = ~~((duration % 3600) / 60)
            var secs = ~~duration % 60

            var ret = ''
            if (hrs > 0) {
                ret += '' + hrs + ':' + (mins < 10 ? '0' : '')
            }

            ret += '' + mins + ':' + (secs < 10 ? '0' : '')
            ret += '' + secs

            if (measure) {
                hrs > 0 ? (ret += ' Std.') : (ret += ' Min.')
            }
            return ret
        },
    }
}
