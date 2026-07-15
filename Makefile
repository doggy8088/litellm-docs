.DEFAULT_GOAL := presentations

.PHONY: presentations

presentations:
	npx --yes @marp-team/marp-cli@latest --server presentations --theme presentations/duotify-slide-template.css --host 127.0.0.1 --port 8080
