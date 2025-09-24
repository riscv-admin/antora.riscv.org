#!/bin/bash
TARGETVERSION=$1
DOCDATE=$2
TEMPDIR=$3
TARGETDIR=$4
SOURCEREPO=$5
SOURCEFOLDER=$6
echo "TARGETVERSION is $TARGETVERSION"
echo "Document date to be used: $DOCDATE"
echo "Temporary directory is $TEMPDIR"
echo "Target directory is $TARGETDIR"
echo "Interface repository is $SOURCEREPO"
echo "Folder name is $SOURCEFOLDER"

cd $TEMPDIR
git clone $SOURCEREPO
cd $SOURCEFOLDER
if [ $TARGETVERSION ] ;
then
git checkout $TARGETVERSION ;
fi
GITVERSION=$(git describe --tags --always |  sed 's/^v//')
echo $GITVERSION
echo
echo "#######################################"
FILEVERSION=v$(echo $GITVERSION)
echo "setting document date to $DOCDATE"
echo "Setting version in filename to $FILEVERSION and starting build of doxygen"
git clone --depth 1 https://github.com/OpenSimulationInterface/proto2cpp.git
mkdir build
sed -i "s/PROJECT_NUMBER\s*= @VERSION_MAJOR@.@VERSION_MINOR@.@VERSION_PATCH@/PROJECT_NUMBER = v$GITVERSION ($DOCDATE)/g" doxygen_config.cmake.in
echo "EXCLUDE_PATTERNS = */osi3/* */protobuf-3.15.8/* */proto2cpp/*" >> doxygen_config.cmake.in
echo "GENERATE_TREEVIEW = YES" >> doxygen_config.cmake.in
# echo "GENERATE_XML = YES" >> doxygen_config.cmake.in
cd build
cmake -D FILTER_PROTO2CPP_PY_PATH=../proto2cpp ..
cmake --build . --config Release
# cmake --build . --config Release -j 4
echo "finished"
mv ../doc/html "../../../$TARGETDIR"
echo "#######################################"
