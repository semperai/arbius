.PHONY: paper.pdf all clean

all: paper.pdf

paper.pdf: paper.tex
	latexmk -pdf -pdflatex="pdflatex -interaction=nonstopmode" -use-make paper.tex

clean:
	latexmk -CA
