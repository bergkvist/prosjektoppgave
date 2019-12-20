IN := report.md
OUT := report.pdf

all: $(OUT)

$(OUT): $(IN)
	pandoc '$(IN)' -o '$(OUT)' --filter pandoc-citeproc --bibliography=references.bib

preview:
	zathura --fork --log-level=error '$(OUT)'

watch:
	ls | entr -c make

edit:
	nohup gedit '$(IN)' >/dev/null &